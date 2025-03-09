"use client";

import React, { useState, useEffect, useRef } from "react";
import { BsPlayFill, BsPauseFill, BsStopFill } from "react-icons/bs";

interface MidiNote {
  id: number;
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
}

interface MidiTrack {
  notes: MidiNote[];
  name?: string;
}

interface MidiData {
  tracks: MidiTrack[];
  duration: number;
}

interface MidiPlayerProps {
  url: string;
  trackId: number;
  startTime: number;
  duration: number;
  isPlaying: boolean;
  currentTime: number;
}

const NOTE_COLORS = [
  "#C2AEDA", // C - Light purple (theme color)
  "#B297D8", // C#
  "#A384D6", // D
  "#9471D4", // D#
  "#855ED2", // E
  "#764BD0", // F
  "#6738CE", // F#
  "#5825CC", // G
  "#4A12CA", // G#
  "#3B00C8", // A
  "#2D00C6", // A#
  "#1E00C4", // B
];

export default function MidiPlayer({
  url,
  trackId,
  startTime,
  duration,
  isPlaying,
  currentTime,
}: MidiPlayerProps) {
  const [midiData, setMidiData] = useState<MidiData | null>(null);
  const [parsedNotes, setParsedNotes] = useState<MidiNote[]>([]);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<number, OscillatorNode>>(new Map());

  // Parse MIDI file
  useEffect(() => {
    const parseMidiFile = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Simple MIDI parser (basic implementation)
        const parsedData = parseMidiBuffer(arrayBuffer);
        setMidiData(parsedData);
        
        // Extract notes for visualization
        const allNotes: MidiNote[] = [];
        parsedData.tracks.forEach(track => {
          track.notes.forEach(note => {
            allNotes.push(note);
          });
        });
        
        setParsedNotes(allNotes);
      } catch (err) {
        console.error("Error parsing MIDI file:", err);
        setError("Failed to parse MIDI file");
      }
    };
    
    parseMidiFile();
  }, [url]);

  // Simple MIDI buffer parser (placeholder implementation)
  const parseMidiBuffer = (buffer: ArrayBuffer): MidiData => {
    // This is a placeholder implementation
    // In a real app, you would use a proper MIDI parser library
    
    // For demo purposes, generate some random notes
    const tracks: MidiTrack[] = [];
    const notes: MidiNote[] = [];
    
    // Generate 50 random notes
    for (let i = 0; i < 50; i++) {
      const pitch = Math.floor(Math.random() * 48) + 36; // Random pitch between 36-84
      const startTime = Math.random() * (duration - 0.5); // Random start time
      const noteDuration = Math.random() * 0.5 + 0.1; // Random duration between 0.1-0.6s
      
      notes.push({
        id: i,
        pitch,
        startTime,
        duration: noteDuration,
        velocity: Math.floor(Math.random() * 40) + 60, // Random velocity between 60-100
      });
    }
    
    tracks.push({
      notes,
      name: "MIDI Track",
    });
    
    return {
      tracks,
      duration,
    };
  };

  // Draw piano roll on canvas
  useEffect(() => {
    if (!canvasRef.current || !parsedNotes.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.fillStyle = "#1f1f1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time)
    const timeStep = canvas.width / duration;
    for (let t = 0; t <= duration; t += 0.5) {
      const x = t * timeStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal grid lines (pitch)
    const pitchStep = canvas.height / 48; // 4 octaves (48 notes)
    for (let p = 0; p <= 48; p++) {
      const y = p * pitchStep;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw notes
    parsedNotes.forEach(note => {
      const x = note.startTime * timeStep;
      const y = canvas.height - ((note.pitch - 36) * pitchStep);
      const width = note.duration * timeStep;
      const height = pitchStep;
      
      // Get color based on pitch class (0-11)
      const pitchClass = note.pitch % 12;
      ctx.fillStyle = NOTE_COLORS[pitchClass];
      
      // Draw note rectangle
      ctx.fillRect(x, y - height, width, height);
      
      // Draw border
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y - height, width, height);
    });
    
    // Draw playhead
    if (currentTime >= startTime && currentTime <= startTime + duration) {
      const playheadX = (currentTime - startTime) * timeStep;
      ctx.strokeStyle = "#bca6cf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
    }
  }, [parsedNotes, currentTime, duration, startTime]);

  // Handle playback
  useEffect(() => {
    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Sync with parent isPlaying state
    setLocalIsPlaying(isPlaying);
    
    return () => {
      // Clean up oscillators
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Ignore errors if oscillator is already stopped
        }
      });
      oscillatorsRef.current.clear();
    };
  }, [isPlaying]);

  // Play notes based on current time
  useEffect(() => {
    if (!localIsPlaying || !parsedNotes.length || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const currentTimeInTrack = currentTime - startTime;
    
    // Find notes that should start playing at current time
    parsedNotes.forEach(note => {
      const noteStartTime = note.startTime;
      const noteEndTime = noteStartTime + note.duration;
      
      // Note should start playing
      if (
        currentTimeInTrack >= noteStartTime &&
        currentTimeInTrack <= noteStartTime + 0.05 &&
        !oscillatorsRef.current.has(note.id)
      ) {
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Set frequency based on MIDI pitch (A4 = 69 = 440Hz)
        const frequency = 440 * Math.pow(2, (note.pitch - 69) / 12);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Set volume based on velocity
        const volume = note.velocity / 127;
        gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start oscillator
        oscillator.start();
        
        // Schedule stop
        const stopTime = audioContext.currentTime + (noteEndTime - currentTimeInTrack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime);
        oscillator.stop(stopTime + 0.1);
        
        // Store oscillator for later cleanup
        oscillatorsRef.current.set(note.id, oscillator);
        
        // Clean up when done
        oscillator.onended = () => {
          oscillatorsRef.current.delete(note.id);
          oscillator.disconnect();
          gainNode.disconnect();
        };
      }
      
      // Note should stop playing
      if (currentTimeInTrack > noteEndTime && oscillatorsRef.current.has(note.id)) {
        const oscillator = oscillatorsRef.current.get(note.id);
        if (oscillator) {
          try {
            oscillator.stop();
            oscillator.disconnect();
          } catch (e) {
            // Ignore errors if oscillator is already stopped
          }
          oscillatorsRef.current.delete(note.id);
        }
      }
    });
  }, [currentTime, localIsPlaying, parsedNotes, startTime]);

  // Handle click on piano roll to add notes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !midiData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to time and pitch
    const timeStep = canvas.width / duration;
    const pitchStep = canvas.height / 48;
    
    const clickTime = x / timeStep;
    const clickPitch = Math.floor(48 - (y / pitchStep)) + 36;
    
    // Create new note
    const newNote: MidiNote = {
      id: Date.now(),
      pitch: clickPitch,
      startTime: clickTime,
      duration: 0.25, // Default duration
      velocity: 80, // Default velocity
    };
    
    // Add note to parsed notes
    setParsedNotes(prev => [...prev, newNote]);
    
    // Play the note
    if (audioContextRef.current) {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set frequency based on MIDI pitch
      const frequency = 440 * Math.pow(2, (newNote.pitch - 69) / 12);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Set volume
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop oscillator
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  if (error) {
    return (
      <div className="w-full h-32 bg-neutral-800 rounded-xl flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 rounded-xl p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">MIDI Piano Roll</h3>
        <div className="text-xs text-neutral-400">
          Click on the piano roll to add notes
        </div>
      </div>
      
      <div className="relative w-full h-48 bg-neutral-800 rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          onClick={handleCanvasClick}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
        <div>Notes: {parsedNotes.length}</div>
        <div>Duration: {duration.toFixed(1)}s</div>
      </div>
    </div>
  );
}
