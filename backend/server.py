import os
import time
import threading
import subprocess
from flask import Flask

app = Flask(__name__)

# Function to run all Python scripts indefinitely
def run_scripts():
    script_processes = {}
    
    while True:
        script_files = [f for f in os.listdir("scripts") if f.endswith(".py")]
        
        for script in script_files:
            script_path = os.path.join("scripts", script)
            
            # If script is not already running, start it
            if script not in script_processes or script_processes[script].poll() is not None:
                print(f"Starting {script}...")
                script_processes[script] = subprocess.Popen(["python3", script_path])
        
        time.sleep(5)  # Check for crashed scripts every 5 seconds

# Start running scripts in a separate thread
threading.Thread(target=run_scripts, daemon=True).start()

@app.route("/")
def home():
    return "Flask server is running all Python scripts!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)