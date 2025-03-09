import os
import requests
import pretty_midi
from supabase import create_client, Client
from basic_pitch.inference import predict

# -----------------------------------------------------------------------------
# 1) SUPABASE CONFIG
# -----------------------------------------------------------------------------
SUPABASE_URL = "https://efvujsescrcsiuqmkxwr.supabase.co"     # Replace with your project URL
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnVqc2VzY3Jjc2l1cW1reHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTk4ODcsImV4cCI6MjA1Njk3NTg4N30.mycV8smkG1A5YE22gEMc6OlHRzJyNIFaeAZwFTuUnjk"                 # Replace with your anon key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Name of your storage bucket in Supabase
BUCKET_NAME = "audio"

# -----------------------------------------------------------------------------
# 2) HELPER FUNCTIONS
# -----------------------------------------------------------------------------

def download_mp3_to_local(mp3_url: str, local_filename: str = "temp_audio.mp3") -> str:
    """
    Downloads an MP3 file from a given URL and saves it locally.
    Returns the local file path.
    """
    print(f"Downloading MP3 from: {mp3_url}")
    response = requests.get(mp3_url)
    response.raise_for_status()  # Raise an error if the request failed
    with open(local_filename, "wb") as f:
        f.write(response.content)
    return local_filename

import os
import basic_pitch
from basic_pitch.inference import predict, Model
from basic_pitch import ICASSP_2022_MODEL_PATH

def convert_mp3_to_midi(mp3_path, midi_out="changed.midi"):
    print(f"Converting {mp3_path} to MIDI...")
    basic_pitch_model = Model(ICASSP_2022_MODEL_PATH)

    # Now call predict with both arguments
    print("Predicting MIDI for", mp3_path, "...")
    model_output, midi_data, note_events = predict(
        mp3_path, basic_pitch_model
    )

    # Save the MIDI data
    midi_data.write(midi_out)
    return midi_out

def upload_midi_to_supabase(midi_path: str) -> str:
    """
    Uploads the given MIDI file to the Supabase storage bucket.
    Returns a public URL for the file if successful, otherwise None.
    """
    file_name = os.path.basename(midi_path)
    
    print(f"Uploading {file_name} to Supabase bucket '{BUCKET_NAME}'...")
    with open(midi_path, "rb") as f:
        file_content = f.read()
    
    # Attempt upload
    response = supabase.storage.from_(BUCKET_NAME).upload(
        file_name,
        file_content,
        file_options={"content-type": "audio/midi"}
    )
    
    if response:
        # Build public URL (assuming the bucket has public access)
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
    else:
        print(f"Failed to upload {file_name}")
        return None

def update_audio_file_record(record_id: int, new_url: str):
    """
    Updates the existing row in 'audio_files' table:
      - Sets url = new_url
      - Sets modification = 'done'
    """
    response = (
        supabase
        .table("audio_files")
        .update({"url": new_url, "modification": "done"})
        .eq("id", record_id)
        .execute()
    )
    if response.error:
        print(f"Failed to update record {record_id}: {response.error}")
    else:
        print(f"Successfully updated record {record_id} with new MIDI URL.")

# -----------------------------------------------------------------------------
# 3) MAIN SCRIPT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    print("Fetching rows where modification = 'midi' from 'audio_files' table...")
    # Query rows that have modification set to "midi"
    rows_response = (
        supabase
        .table("audio_files")
        .select("*")
        .eq("modification", "midi")
        .execute()
    )
    

    rows = rows_response.data
    if not rows:
        print("No rows found with modification = 'midi'.")
    else:
        for row in rows:
            record_id = row["id"]
            mp3_url = row["url"]
            
            # 1) Download MP3 locally
            local_mp3 = download_mp3_to_local(mp3_url, f"temp_{record_id}.mp3")
            
            # 2) Convert MP3 -> MIDI
            midi_file = convert_mp3_to_midi(local_mp3, f"converted_{record_id}.midi")
            
            # 3) Upload MIDI to Supabase
            midi_url = upload_midi_to_supabase(midi_file)
            if midi_url:
                # 4) Update the existing record with new MIDI URL
                update_audio_file_record(record_id, midi_url)
            
            # (Optional) Remove local temp files
            if os.path.exists(local_mp3):
                os.remove(local_mp3)
            if os.path.exists(midi_file):
                os.remove(midi_file)

    print("Done processing all files!")