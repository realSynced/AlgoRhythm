"use client";

import { useEffect, useState, useRef } from "react";
import AudioRecorder from "../components/AudioRecorder";

interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
}

export default function CreateMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const audioContextRef = useRef<AudioContext | null>(null);
  const trackNodesRef = useRef<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map());

  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const addTrack = () => {
    const newTrack: Track = {
      id: Math.random().toString(36).substring(7),
      name: `Track ${tracks.length + 1}`,
      volume: 0.8,
      muted: false,
      soloed: false,
    };
    setTracks([...tracks, newTrack]);
  };

  const handleRecordingComplete = async (trackId: string, audioBlob: Blob) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioUrl = URL.createObjectURL(audioBlob);

      setTracks(tracks.map(track => 
        track.id === trackId 
          ? { ...track, audioUrl, audioBuffer }
          : track
      ));
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio recording');
    }
  };

  const playTrack = (track: Track) => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !track.audioBuffer) return;

    const existingNodes = trackNodesRef.current.get(track.id);
    if (existingNodes) {
      existingNodes.source.stop();
      existingNodes.source.disconnect();
      existingNodes.gain.disconnect();
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = track.audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = track.muted ? 0 : track.volume;

    source.start(0);
    trackNodesRef.current.set(track.id, { source, gain: gainNode });
  };

  const togglePlay = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (isPlaying) {
      trackNodesRef.current.forEach(({ source }) => {
        source.stop();
      });
      trackNodesRef.current.clear();
    } else {
      tracks.forEach(track => {
        if (track.audioBuffer) {
          playTrack(track);
        }
      });
    }
    setIsPlaying(!isPlaying);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(track => {
      if (track.id === id) {
        const updatedTrack = { ...track, ...updates };
        const nodes = trackNodesRef.current.get(id);
        if (nodes && nodes.gain) {
          nodes.gain.gain.value = updatedTrack.muted ? 0 : updatedTrack.volume;
        }
        return updatedTrack;
      }
      return track;
    }));
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar - Track Management */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Tracks</h2>
            <button
              onClick={addTrack}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tracks.map((track) => (
            <div 
              key={track.id} 
              className="p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={track.name}
                  onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                  className="bg-zinc-800 px-2 py-1 rounded flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={() => setTracks(tracks.filter(t => t.id !== track.id))}
                  className="text-zinc-400 hover:text-red-400 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AudioRecorder onRecordingComplete={(blob) => handleRecordingComplete(track.id, blob)} />
                  {track.audioUrl && (
                    <div className="text-xs text-purple-400">✓ Recorded</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateTrack(track.id, { muted: !track.muted })}
                    className={`px-2 py-1 rounded text-xs ${track.muted ? 'bg-red-500' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
                    className={`px-2 py-1 rounded text-xs ${track.soloed ? 'bg-purple-500' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                  >
                    S
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {tracks.length === 0 && (
            <div className="text-center text-zinc-500 p-4">
              Click + to add a track
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">BPM:</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="bg-zinc-800 px-2 py-1 rounded w-20 text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
              min="20"
              max="300"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Time:</span>
            <div className="bg-zinc-800 px-3 py-1 rounded font-mono">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Waveform Display Area */}
        <div className="flex-1 p-4 bg-black">
          <div className="bg-zinc-900 rounded-lg h-full flex items-center justify-center text-zinc-400">
            {tracks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 w-full p-4">
                {tracks.map(track => (
                  <div key={track.id} className="bg-zinc-800 rounded p-2">
                    {track.audioUrl ? (
                      <audio src={track.audioUrl} controls className="w-full" />
                    ) : (
                      <div className="text-center py-4 text-zinc-500">No audio recorded</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500">Add tracks to start recording</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
