import serial
import re
import time
import random
import numpy as np
import sounddevice as sd
import wave
import subprocess

# -----------------------------------------------------
# Global Variables
# -----------------------------------------------------

# We'll store our *target* joystick values [j, p, r, y] from the serial input
target_joystick_values = [0.0, 0.0, 0.0, 0.0]
smoothed_joystick_values = [0.0, 0.0, 0.0, 0.0]

# Define a bigger C major scale from ~C2 (65.41 Hz) up to C6 (~1046.50 Hz)
SCALE_FREQS = [
    65.41,   # C2
    73.42,   # D2
    82.41,   # E2
    87.31,   # F2
    98.00,   # G2
    110.00,  # A2
    123.47,  # B2
    130.81,  # C3
    146.83,  # D3
    164.81,  # E3
    174.61,  # F3
    196.00,  # G3
    220.00,  # A3
    246.94,  # B3
    261.63,  # C4
    293.66,  # D4
    329.63,  # E4
    349.23,  # F4
    392.00,  # G4
    440.00,  # A4
    493.88,  # B4
    523.25,  # C5
    587.33,  # D5
    659.25,  # E5
    698.46,  # F5
    783.99,  # G5
    880.00,  # A5
    987.77,  # B5
    1046.50, # C6
]

# We define partial offsets in terms of scale-steps, going up multiple octaves.
PARTIAL_SCALE_OFFSETS = [0, 2, 4, 7, 12, 14, 16, 19]

# For each partial, we'll track:
partial_phase   = [0.0 for _ in PARTIAL_SCALE_OFFSETS]   # sine wave phase
partial_amp     = [0.5 for _ in PARTIAL_SCALE_OFFSETS]   # amplitude drift
partial_detune  = [0.0 for _ in PARTIAL_SCALE_OFFSETS]   # micro-tuning offsets

# Amplitude & detune constraints
AMP_MIN, AMP_MAX = 0.2, 0.8
AMP_DRIFT_STEP   = 0.01
DETUNE_RANGE_CENTS = 10
DETUNE_STEP_CENTS  = 0.5

# Additional ring mod oscillator
phase_ring   = 0.0
ring_mod_freq = 5.0
vibrato_rate  = 0.2  # slow LFO for vibrato

# Simple Feedback Reverb
SAMPLE_RATE         = 44100
REVERB_BUFFER_SIZE  = SAMPLE_RATE * 3  # 3-second buffer
reverb_buffer       = np.zeros(int(REVERB_BUFFER_SIZE), dtype=np.float32)
reverb_head         = 0

REVERB_DELAY_SEC    = 0.5
reverb_delay_samples= int(REVERB_DELAY_SEC * SAMPLE_RATE)
REVERB_FEEDBACK     = 0.5
REVERB_WET          = 0.3

# Smoothing factor for joystick data
SMOOTH_ALPHA = 0.1

# --------------------
# Recording / playback
# --------------------
is_playing = False       # Whether we generate audio or not
recording  = False       # Whether we're capturing audio for MP3
audio_data = []          # Buffer for recorded float samples

# -----------------------------------------------------
# Utility Functions
# -----------------------------------------------------
def clamp_value(val, low, high):
    return max(low, min(val, high))

def parse_line(line):
    """
    Parse a serial line with 4 floats, e.g.:
      "Joystick X: 0 | Roll: 4.25 | Pitch: -1.94 | Yaw: -27.81"
    Clamps:
      j in [-25, 25], p/r/y in [-90, 90]
    Returns [j, p, r, y] or None if parse fails.
    """
    nums = re.findall(r'[-+]?\d*\.?\d+', line)
    if len(nums) < 4:
        return None

    j, p, r, y = [float(x) for x in nums[:4]]
    j = clamp_value(j, -25, 25)
    p = clamp_value(p, -90, 90)
    r = clamp_value(r, -90, 90)
    y = clamp_value(y, -90, 90)
    return [j, p, r, y]

def cents_to_ratio(cents):
    # 100 cents = 1 semitone => ratio = 2^(1/12)
    # X cents => ratio = 2^(X/1200)
    return 2.0**(cents/1200.0)

# -----------------------------------------------------
# Audio Callback
# -----------------------------------------------------
def audio_callback(outdata, frames, time_info, status_flags):
    global target_joystick_values, smoothed_joystick_values
    global partial_phase, partial_amp, partial_detune
    global phase_ring, reverb_buffer, reverb_head
    global is_playing, recording, audio_data

    # If we are not playing, output silence
    if not is_playing:
        outdata[:] = 0
        return

    # 1) Smooth joystick/pitch/roll/yaw
    for i in range(4):
        smoothed_joystick_values[i] = (
            (1.0 - SMOOTH_ALPHA) * smoothed_joystick_values[i]
            + SMOOTH_ALPHA      * target_joystick_values[i]
        )

    j, p, r, y = smoothed_joystick_values

    # 2) Derive parameters
    #   a) Convert pitch p => scale index
    p_norm = (p + 90.0) / 180.0
    p_norm = clamp_value(p_norm, 0.0, 1.0)
    scale_index = int(p_norm * (len(SCALE_FREQS) - 1))

    #   b) Base note frequency
    base_note_freq = SCALE_FREQS[scale_index]

    #   c) Vibrato depth from roll => up to ±10 Hz
    vibrato_depth = (abs(r)/90.0)*10.0

    #   d) Yaw => master volume [0..1]
    master_vol = (y + 90.0)/180.0
    master_vol = clamp_value(master_vol, 0.0, 1.0)

    #   e) Joystick => ring mod depth
    ring_mod_depth = j / 25.0

    # 3) Randomly drift partial amplitudes and detuning
    import math
    for i_par in range(len(partial_amp)):
        # amplitude drift
        partial_amp[i_par] += (random.random()*2 - 1)*AMP_DRIFT_STEP
        partial_amp[i_par] = clamp_value(partial_amp[i_par], AMP_MIN, AMP_MAX)

        # detune drift in cents
        partial_detune[i_par] += (random.random()*2 - 1)*DETUNE_STEP_CENTS
        partial_detune[i_par] = clamp_value(partial_detune[i_par],
                                            -DETUNE_RANGE_CENTS,
                                             DETUNE_RANGE_CENTS)

    # Prepare wave buffer
    wave_out = np.zeros(frames, dtype=np.float32)

    # 4) Generate audio for each sample
    for i_smp in range(frames):
        partial_sum = 0.0

        for idx, offset_steps in enumerate(PARTIAL_SCALE_OFFSETS):
            # offset note index => clamp to scale bounds
            note_index = scale_index + offset_steps
            note_index = clamp_value(note_index, 0, len(SCALE_FREQS)-1)

            base_scale_freq = SCALE_FREQS[int(note_index)]
            # apply micro-detune
            detune_ratio = cents_to_ratio(partial_detune[idx])
            final_freq = base_scale_freq * detune_ratio

            # vibrato
            vib = vibrato_depth * np.sin(2.0*np.pi*vibrato_rate*partial_phase[idx])
            freq_now = final_freq + vib

            # sine wave
            s_val = np.sin(2.0*np.pi * partial_phase[idx])
            s_val *= partial_amp[idx]  # scale by partial amplitude

            partial_sum += s_val

            # increment partial phase
            partial_phase[idx] += freq_now / SAMPLE_RATE
            if partial_phase[idx] > 1e10:
                partial_phase[idx] = 0.0

        # ring mod
        ring_val = np.sin(2.0*np.pi*phase_ring)
        partial_sum *= (1.0 + ring_mod_depth * ring_val)

        # increment ring phase
        phase_ring += ring_mod_freq / SAMPLE_RATE
        if phase_ring > 1e10:
            phase_ring = 0.0

        # final volume
        partial_sum *= master_vol

        wave_out[i_smp] = partial_sum

    # 5) Simple Feedback Reverb
    for i_smp in range(frames):
        dry = wave_out[i_smp]
        read_idx = (reverb_head + reverb_delay_samples) % REVERB_BUFFER_SIZE
        delayed_signal = reverb_buffer[read_idx]

        wet = delayed_signal * REVERB_WET
        out_sample = dry + wet

        # feedback write
        reverb_buffer[reverb_head] = out_sample * REVERB_FEEDBACK

        wave_out[i_smp] = out_sample

        reverb_head = (reverb_head + 1) % REVERB_BUFFER_SIZE

    # 6) Stereo output
    outdata[:, 0] = wave_out
    outdata[:, 1] = wave_out

    # 7) If recording, store samples for final WAV/MP3
    if recording:
        audio_data.extend(wave_out)

# -----------------------------------------------------
# Main
# -----------------------------------------------------
def main():
    # Change this to your actual serial port, e.g. COM5 on Windows or /dev/ttyUSB0 on Linux
    port = "/dev/cu.usbserial-10"
    baud_rate = 115200

    try:
        ser = serial.Serial(port, baud_rate, timeout=1)
        print(f"Connected to {ser.portstr}")
    except serial.SerialException as e:
        print(f"Error opening serial port {port}: {e}")
        return

    with sd.OutputStream(channels=2, samplerate=SAMPLE_RATE, callback=audio_callback):
        try:
            while True:
                line = ser.readline().decode('utf-8', errors='replace').strip()
                if not line:
                    continue

                # Check for "started" or "stopped"
                if line == "started":
                    print("Received 'started': playing & recording...")
                    global is_playing, recording, audio_data
                    is_playing = True
                    recording = True
                    audio_data = []

                elif line == "stopped":
                    print("Received 'stopped': stopping & saving MP3...")
                    is_playing = False
                    recording = False

                    # Save to WAV then convert to MP3
                    wav_filename = "recorded_audio.wav"
                    mp3_filename = "recorded_audio.mp3"

                    # Convert from float32 → int16 for WAV
                    # ***IMPORTANT*** Here we reduce amplitude by *0.5* to make the MP3 quieter
                    float_array = np.array(audio_data, dtype=np.float32) * 0.5
                    int_samples = (float_array * 32767.0).astype(np.int16)

                    with wave.open(wav_filename, "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)  # 16-bit
                        wf.setframerate(SAMPLE_RATE)
                        wf.writeframes(int_samples.tobytes())

                    subprocess.run([
                        "ffmpeg", "-y",
                        "-i", wav_filename,
                        "-codec:a", "libmp3lame",
                        mp3_filename
                    ], check=True)

                    print(f"Saved: {mp3_filename}")

                else:
                    # Otherwise, assume it's joystick data
                    parsed = parse_line(line)
                    if parsed is not None:
                        global target_joystick_values
                        target_joystick_values = parsed
                    print(f"Raw: {line} | Target: {target_joystick_values}")

                time.sleep(0.01)

        except KeyboardInterrupt:
            print("Exiting program...")
        finally:
            ser.close()

if __name__ == "__main__":
    main()
