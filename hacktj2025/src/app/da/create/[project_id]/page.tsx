"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { GrUndo } from "react-icons/gr";
import { GrRedo } from "react-icons/gr";
import {
  BsSkipStartFill,
  BsPlayFill,
  BsPauseFill,
  BsStopFill,
  BsRecordFill,
  BsPlus,
  BsTrash,
} from "react-icons/bs";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/dropdown";

import { useDisclosure, Modal, Button } from "@nextui-org/react";
import ManageFilesModal from "@/app/da/components/ManageFilesModal";
import MidiPlayer from "@/app/da/components/MidiPlayer";
import LyricToVocalsModal from "@/app/da/components/LyricToVocalsModal";
import { useRouter } from "next/navigation";

interface Track {
  id: number;
  name: string;
  trackType: string;
}

interface AudioFile {
  id: string;
  name: string;
  url: string;
  trackId: number;
  startTime: number;
  duration: number;
  type?: string;
}

export default function CreateMusic({ params }: { params: any }) {
  const router = useRouter();
  // @ts-expect-error
  const { project_id } = React.use(params);

  // console.log("Project ID:", project_id);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [audioElements, setAudioElements] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isManageFilesModalOpen, setIsManageFilesModalOpen] = useState(false);
  const [isLyricToVocalsOpen, setIsLyricToVocalsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioFilesRef = useRef<File[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  // Calculate total duration based on audio files
  const totalDuration = useMemo(() => {
    let maxEndTime = 60; // Default 60 seconds duration as per requirements
    audioFiles.forEach((file) => {
      const endTime = file.startTime + file.duration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }
    });
    return maxEndTime;
  }, [audioFiles]);

  const handleFileUpload = useCallback(
    (files: File[], convertToMidi?: boolean) => {
      if (!selectedTrack) {
        alert("Please select a track first");
        return;
      }

      const newAudioFiles: AudioFile[] = [];

      for (const file of files) {
        const fileType =
          file.type ||
          (file.name.endsWith(".mid") || file.name.endsWith(".midi")
            ? "audio/midi"
            : "");
        const url = URL.createObjectURL(file);
        const audio = new Audio();

        // For MIDI files, set a default duration
        const isMidi =
          fileType === "audio/midi" ||
          file.name.endsWith(".mid") ||
          file.name.endsWith(".midi");

        if (isMidi) {
          // For MIDI files, use a default duration
          const newAudioFile: AudioFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url,
            trackId: selectedTrack.id,
            startTime: 0,
            duration: 30, // Default duration for MIDI files
            type: "midi",
          };
          newAudioFiles.push(newAudioFile);

          // Create audio element for the file
          setAudioElements((prev) => ({
            ...prev,
            [newAudioFile.id]: audio,
          }));
        } else {
          // For regular audio files
          audio.src = url;
          audio.addEventListener("loadedmetadata", () => {
            const newAudioFile: AudioFile = {
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              url,
              trackId: selectedTrack.id,
              startTime: 0,
              duration: audio.duration,
              type: "audio",
            };
            setAudioFiles((prev) => [...prev, newAudioFile]);

            // Create audio element for the file
            setAudioElements((prev) => ({
              ...prev,
              [newAudioFile.id]: audio,
            }));
          });
        }
      }

      if (newAudioFiles.length > 0) {
        setAudioFiles((prev) => [...prev, ...newAudioFiles]);
      }
    },
    [selectedTrack]
  );

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: Date.now(),
      name: `Track ${tracks.length + 1}`,
      trackType: "Audio",
    };
    setTracks([...tracks, newTrack]);
    setSelectedTrack(newTrack);
  };

  const handleDeleteTrack = (id: number) => {
    setTracks(tracks.filter((track) => track.id !== id));
    setAudioFiles(audioFiles.filter((file) => file.trackId !== id));
    if (selectedTrack?.id === id) {
      setSelectedTrack(null);
    }
  };

  const handleUpdateTrackName = (id: number, newName: string) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, name: newName } : track
      )
    );
  };

  const handleUpdateTrackType = (id: number, type: string) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, trackType: type } : track
      )
    );
  };

  // Load audio elements when audio files change
  useEffect(() => {
    // Cleanup function to prevent memory leaks
    return () => {
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [audioFiles]);

  // Handle playback with optimized dependencies
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((time) => {
          if (time >= totalDuration) {
            // We'll handle stopping outside this callback to avoid nested state updates
            return totalDuration;
          }
          return time + 0.02; // Update every 20ms for smoother animation
        });
      }, 20);
    } else if (timer) {
      clearInterval(timer);
    }

    setTimer(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, totalDuration]); // Removed audioElements, audioFiles, and timer

  // Handle audio playback separately based on current time
  useEffect(() => {
    if (currentTime >= totalDuration && isPlaying) {
      setIsPlaying(false);
      // Reset all audio elements
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setCurrentTime(0);
      return;
    }

    // Update audio playback based on current time
    audioFiles.forEach((file) => {
      const audio = audioElements[file.id];
      if (audio) {
        if (
          currentTime >= file.startTime &&
          currentTime < file.startTime + file.duration &&
          isPlaying
        ) {
          if (audio.paused) {
            audio.currentTime = currentTime - file.startTime;
            const playPromise = audio.play();
            // Handle play promise to avoid uncaught promise errors
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.error("Audio play error:", error);
              });
            }
          }
        } else {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
  }, [currentTime, isPlaying, audioElements, audioFiles, totalDuration]);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsRecording(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsRecording(false);
    setCurrentTime(0);
    // Reset all audio elements
    Object.values(audioElements).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const handleRecord = async () => {
    if (!isRecording) {
      if (!selectedTrack) {
        alert("Please select a track first");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(recordedChunksRef.current, {
            type: "audio/wav",
          });
          const audioFile = new File(
            [audioBlob],
            `recording-${Date.now()}.wav`,
            {
              type: "audio/wav",
            }
          );

          // Store the recorded file for the ManageFilesModal
          recordedAudioFilesRef.current = [
            ...recordedAudioFilesRef.current,
            audioFile,
          ];

          // Create audio URL for playback
          const audioUrl = URL.createObjectURL(audioBlob);

          // Calculate duration
          const audio = new Audio(audioUrl);
          audio.addEventListener("loadedmetadata", () => {
            // Add to audio files with calculated duration
            const newAudioFile: AudioFile = {
              id: Math.random().toString(36).substr(2, 9),
              name: audioFile.name,
              url: audioUrl,
              trackId: selectedTrack!.id,
              startTime: recordingStartTime,
              duration: audio.duration,
            };

            // Add to audio files state
            setAudioFiles((prev) => [...prev, newAudioFile]);

            // Create audio element for playback
            setAudioElements((prev) => ({ ...prev, [newAudioFile.id]: audio }));
          });

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        // Start recording
        mediaRecorder.start();
        setRecordingStartTime(currentTime);
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        alert("Could not access microphone. Please check permissions.");
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handleManageFiles = () => {
    setIsManageFilesModalOpen(true);
  };

  const handleLyricToVocals = (audioUrl: string) => {
    console.log("Generated vocals URL:", audioUrl);
    
    if (!audioUrl || !selectedTrack) return;
    
    // Create a new audio file from the generated vocals
    const newAudioFile: AudioFile = {
      id: `generated-${Date.now()}`,
      name: "Generated Vocals",
      url: audioUrl,
      trackId: selectedTrack.id,
      startTime: 0,
      duration: 30, // Default duration, will be updated when loaded
      type: "audio"
    };
    
    // Add the new audio file to the state
    setAudioFiles((prev) => [...prev, newAudioFile]);
    
    // Create an audio element for the file to get its duration
    const audio = new Audio(audioUrl);
    audio.addEventListener("loadedmetadata", () => {
      // Update the duration once the audio is loaded
      setAudioFiles((prev) => 
        prev.map(file => 
          file.id === newAudioFile.id 
            ? { ...file, duration: audio.duration } 
            : file
        )
      );
    });
    
    // Add the audio element to the audioElements state
    setAudioElements((prev) => ({
      ...prev,
      [newAudioFile.id]: audio
    }));
    
    // Show a success message
    alert("Vocals generated successfully and added to your track!");
  };

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      // Update audio positions
      audioFiles.forEach((file) => {
        const audio = audioElements[file.id];
        if (audio) {
          if (time >= file.startTime && time < file.startTime + file.duration) {
            audio.currentTime = time - file.startTime;
            if (isPlaying) {
              audio.play();
            }
          } else {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      });
    },
    [audioElements, audioFiles, isPlaying]
  );

  const handleFileDrop = useCallback((e: React.DragEvent, trackId: number) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) =>
      /\.(wav|mp3|ogg|aac|m4a|mid|midi)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert(
        "Please drop valid audio files (WAV, MP3, OGG, AAC, M4A, MID, MIDI)"
      );
      return;
    }

    // Create new audio files
    const newAudioFiles: AudioFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      trackId,
      startTime: 0,
      duration: 0,
      type:
        file.name.endsWith(".mid") || file.name.endsWith(".midi")
          ? "midi"
          : "audio",
    }));

    setAudioFiles((prev) => [...prev, ...newAudioFiles]);
  }, []);

  const handleAudioMove = useCallback(
    (fileId: string, trackId: number, startTime: number) => {
      setAudioFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, trackId, startTime } : file
        )
      );
    },
    []
  );

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const centiseconds = Math.floor((time % 1) * 100); // Changed to centiseconds for more precision
    return {
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
      centiseconds: String(Math.min(centiseconds, 99)).padStart(2, "0"), // Ensure we don't exceed 99
    };
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollPosition(scrollLeft);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <div className="flex flex-col h-screen bg-black text-white top-0 overflow-y-hidden">
        <div className="h-[10rem] flex items-center w-full p-5 border-b border-neutral-500/50">
          <div className="text-white sticky top-0 mb-auto flex flex-col text-left h-full w-[28.1rem] items-start ">
            <div className="flex flex-col items-start text-left">
              <p className="text-8xl font-bold">DAW</p>
              <p className="text-sm text-neutral-400">
                Digital Audio Workstation
              </p>
            </div>
            {/* <p className="text-sm text-neutral-400">
            Click on the canvas to create a new track. You can then drag and
            drop the track to move it around.
          </p> */}
          </div>
          <div className="mb-auto flex flex-col items-center space-y-6 gap-2 w-full h-full">
            <input
              className="text-4xl font-bold bg-transparent border-b-2 border-neutral-300 outline-none "
              placeholder="New Project"
              type="text"
            />
            <div className="flex items-center justify-center space-x-6 py-4 -translate-y-4">
              <div className="flex items-center w-max bg-neutral-800 rounded-full">
                <button 
                  className="rounded-full p-3 hover:bg-[#bca6cf] transition-colors bg-neutral-700 text-white text-xl"
                  onClick={() => setIsLyricToVocalsOpen(true)}
                >
                  Lyric to Vocals
                </button>
              </div>
              {/* Undo and Redo buttons */}
              <div className="flex items-center w-max bg-neutral-800 rounded-full">
                <button className="rounded-l-full p-3 hover:bg-[#bca6cf] transition-colors">
                  <GrUndo className="text-3xl" />
                </button>
                <button className="rounded-r-full p-3 hover:bg-[#bca6cf] transition-colors">
                  <GrRedo className="text-3xl" />
                </button>
              </div>
              {/* Playback controls */}
              <div className="flex items-center bg-neutral-800/50 rounded-3xl shadow-lg border border-neutral-700/30 backdrop-blur-sm">
                <button
                  className={`p-3 rounded-l-3xl transition-all duration-200 ${
                    isPlaying
                      ? "bg-[#bca6cf] text-neutral-900 shadow-inner"
                      : "hover:bg-[#bca6cf]/20 text-white"
                  }`}
                  onClick={handlePlay}
                  disabled={isPlaying}
                >
                  <BsPlayFill
                    className={`text-3xl transform transition-transform ${isPlaying ? "scale-105" : ""}`}
                  />
                </button>
                <div className="w-px h-8 bg-neutral-700/30" />
                <button
                  className={`p-3 transition-all duration-200 ${
                    !isPlaying && isRecording
                      ? "hover:bg-[#bca6cf]/20 text-white"
                      : isPlaying
                        ? "bg-[#bca6cf] text-neutral-900 shadow-inner"
                        : "text-neutral-500"
                  }`}
                  onClick={handlePause}
                  disabled={!isPlaying}
                >
                  <BsPauseFill
                    className={`text-3xl transform transition-transform ${!isPlaying ? "" : "scale-105"}`}
                  />
                </button>
                <div className="w-px h-8 bg-neutral-700/30" />
                <button
                  className="p-3 transition-all duration-200 hover:bg-[#bca6cf]/20 text-white"
                  onClick={handleStop}
                >
                  <BsStopFill className="text-3xl" />
                </button>
                <div className="w-px h-8 bg-neutral-700/30" />
                <button
                  className={`p-3 rounded-r-3xl transition-all duration-200 ${
                    isRecording
                      ? "bg-[#bca6cf] text-neutral-900 shadow-inner"
                      : "hover:bg-[#bca6cf]/20 text-white"
                  }`}
                  onClick={handleRecord}
                  disabled={false}
                >
                  <BsRecordFill
                    className={`text-3xl transition-all duration-200 ${
                      isRecording
                        ? "text-red-600 animate-pulse scale-105"
                        : "text-red-500 hover:text-red-400"
                    }`}
                  />
                </button>
              </div>
              {/* Time display */}
              <div className="bg-neutral-800/50 px-6 py-2 rounded-3xl shadow-lg border border-neutral-700/30 backdrop-blur-sm">
                <div className="text-2xl font-mono tracking-wider">
                  <span className="text-[#bca6cf]">
                    {formatTime(currentTime).minutes}
                  </span>
                  <span className="text-neutral-500">:</span>
                  <span className="text-[#bca6cf]">
                    {formatTime(currentTime).seconds}
                  </span>
                  <span className="text-neutral-500">.</span>
                  <span className="text-[#bca6cf]/70">
                    {formatTime(currentTime).centiseconds}
                  </span>
                </div>
              </div>

              <div>
                <button className="px-6 py-2 border border-neutral-700/30 text-xl rounded-3xl transition-all duration-200 bg-neutral-800 hover:bg-[#bca6cf]/20 text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center w-[full] h-full ">
          <div className="text-white h-full w-[28.1rem] flex border-r border-neutral-500/50">
            {/* Sidebar */}
            {tracks.length === 0 ? (
              <button
                onClick={handleAddTrack}
                className="w-full h-full font-bold text-white bg-neutral-800 hover:bg-neutral-700"
              >
                Click anywhere to create a new track
              </button>
            ) : (
              <>
                <div className="flex flex-col w-full h-[calc(100vh-10rem)] overflow-y-scroll scrollbar-none">
                  <div className="w-full h-[4rem] flex justify-start items-center space-x-4 p-4">
                    <button
                      onClick={handleAddTrack}
                      className="flex items-center rounded-full px-3 py-1 font-bold text-white bg-neutral-800 hover:bg-[#bca6cf] transition-colors"
                    >
                      <BsPlus className="text-3xl" /> Add Track
                    </button>
                    <button
                      onClick={handleManageFiles}
                      className="flex items-center rounded-full px-3 py-1 font-bold text-white bg-neutral-800 hover:bg-[#bca6cf] transition-colors"
                    >
                      <BsPlus className="text-3xl" /> Add Files
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {tracks.map((track) => (
                      <TrackLeftDesign
                        key={track.id}
                        id={track.id}
                        name={track.name}
                        trackType={track.trackType}
                        isSelected={selectedTrack?.id === track.id}
                        onSelect={() => setSelectedTrack(track)}
                        onDelete={handleDeleteTrack}
                        onUpdateName={handleUpdateTrackName}
                        onUpdateTrackType={handleUpdateTrackType}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className=" w-full h-full">
            {/* Canvas track */}
            {tracks.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p>Please add a track</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <TimelineRuler
                  playing={isPlaying}
                  currentTime={currentTime}
                  duration={totalDuration}
                  onSeek={handleSeek}
                  onScroll={handleScroll}
                  scrollPosition={scrollPosition}
                />
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-x-auto"
                  onScroll={handleScroll}
                >
                  <div
                    style={{ minWidth: `${totalDuration * 100}px` }}
                    className="flex flex-col gap-0.5"
                  >
                    {tracks.map((track) => (
                      <Timeline
                        key={track.id}
                        trackId={track.id}
                        files={audioFiles.filter((f) => f.trackId === track.id)}
                        onFileDrop={handleFileDrop}
                        onAudioMove={handleAudioMove}
                        duration={totalDuration}
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ManageFilesModal
        isOpen={isManageFilesModalOpen}
        onOpenChange={() => setIsManageFilesModalOpen(false)}
        onFileUpload={handleFileUpload}
        projectId={4}
        recordedFiles={recordedAudioFilesRef.current}
      />
      <LyricToVocalsModal
        isOpen={isLyricToVocalsOpen}
        onOpenChange={() => setIsLyricToVocalsOpen(!isLyricToVocalsOpen)}
        onClose={() => setIsLyricToVocalsOpen(false)}
        onGenerateVocals={handleLyricToVocals}
      />
    </>
  );
}

// FindTrackLeftDesign
function TrackLeftDesign({
  id,
  name,
  trackType,
  isSelected,
  onSelect,
  onDelete,
  onUpdateName,
  onUpdateTrackType,
}: {
  id: number;
  name: string;
  trackType: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: number) => void;
  onUpdateName: (id: number, name: string) => void;
  onUpdateTrackType: (id: number, type: string) => void;
}) {
  const [inputValue, setInputValue] = React.useState(name);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(id);
    }, 200);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setInputValue(newName);
    onUpdateName(id, newName);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue.trim() === "") {
      setInputValue(name);
      onUpdateName(id, name);
    }
  };

  return (
    <div
      className={`w-full h-[8rem] text-white transition-all duration-200 ${
        isDeleting ? "opacity-50 scale-95" : ""
      } ${
        isSelected
          ? "bg-[#bca6cf]/20 hover:bg-[#bca6cf]/30"
          : "bg-neutral-800 hover:bg-neutral-700"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="relative items-center flex">
                <div className="flex flex-col">
                  <input
                    type="text"
                    className={`text-2xl font-bold outline-none min-w-[8rem] w-[6.5rem] bg-transparent px-2 py-1 rounded transition-all ${
                      isEditing
                        ? "bg-neutral-700/50 ring-2 ring-[#bca6cf]"
                        : "hover:bg-neutral-700/50"
                    }`}
                    value={inputValue}
                    onChange={handleNameChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    maxLength={10}
                    placeholder="Track Name"
                  />
                  <Dropdown>
                    <DropdownTrigger>
                      <button className="text-xs text-neutral-400 bg-neutral-700/50 rounded px-2 py-1 hover:bg-neutral-700">
                        Choose Track Type
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownSection className="bg-neutral-700 px-2">
                        <DropdownItem
                          key="audio"
                          onClick={() => onUpdateTrackType(id, "Audio")}
                          className="text-white hover:bg-neutral-600 w-full"
                        >
                          Audio
                        </DropdownItem>
                        <DropdownItem
                          key="vocal"
                          onClick={() => onUpdateTrackType(id, "Vocal")}
                          className="text-white hover:bg-neutral-600 w-full"
                        >
                          Vocal
                        </DropdownItem>
                        <DropdownItem
                          key="midi"
                          onClick={() => onUpdateTrackType(id, "Midi")}
                          className="text-white hover:bg-neutral-600 w-full"
                        >
                          Midi
                        </DropdownItem>
                      </DropdownSection>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                {/* {isEditing && (
                  <div className="absolute -bottom-4 right-0 text-xs text-neutral-400">
                    {10 - inputValue.length} chars left
                  </div>
                )} */}
              </div>
              <button
                onClick={handleDelete}
                className="flex items-center rounded-full p-2 font-bold text-white bg-neutral-700 hover:bg-red-500 transition-colors"
                disabled={isDeleting}
              >
                <BsTrash className="text-lg" />
              </button>
            </div>
          </div>
          <div className="text-sm text-neutral-400">
            <p>Type: {trackType}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeline({
  trackId,
  files,
  onFileDrop,
  onAudioMove,
  duration,
  isPlaying,
  currentTime,
}: {
  trackId: number;
  files: AudioFile[];
  onFileDrop: (e: React.DragEvent, trackId: number) => void;
  onAudioMove: (fileId: string, trackId: number, startTime: number) => void;
  duration: number;
  isPlaying: boolean;
  currentTime: number;
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      onFileDrop(e, trackId);
    },
    [onFileDrop, trackId]
  );

  const handleAudioDragStart = useCallback(
    (e: React.DragEvent, fileId: string) => {
      e.dataTransfer.setData("text/plain", fileId);
    },
    []
  );

  const handleAudioDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const fileId = e.dataTransfer.getData("text/plain");
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, Math.round((x / 100) * 2) / 2); // Snap to 0.5s intervals

      onAudioMove(fileId, trackId, startTime);
    },
    [onAudioMove, trackId]
  );

  return (
    <div
      ref={timelineRef}
      className={`w-full h-[8rem] bg-neutral-800 text-white transition-colors relative ${
        isDraggingOver ? "bg-[#bca6cf]/10" : "hover:bg-neutral-700"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleAudioDrop}
    >
      {/* Grid lines for time markers */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 120 }).map((_, i) => (
          <div
            key={i}
            className={`absolute top-0 bottom-0 w-px bg-neutral-700 ${
              i % 2 === 0 ? "opacity-30" : "opacity-10"
            }`}
            style={{ left: `${i * 50}px` }}
          />
        ))}
      </div>

      {/* Drop zone indicator */}
      {files.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm border-2 border-dashed border-neutral-700 m-4 rounded-lg">
          Drop audio files here
        </div>
      )}

      {/* Audio clips */}
      <div className="absolute inset-0 p-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="absolute h-full rounded-lg bg-neutral-700 cursor-move"
            style={{
              left: `${(file.startTime / duration) * 100}%`,
              width: `${(file.duration / duration) * 100}%`,
            }}
            draggable
            onDragStart={(e) => handleAudioDragStart(e, file.id)}
            onDragEnd={handleAudioDrop}
          >
            <div className="p-2 text-xs truncate">{file.name}</div>

            {/* Render MIDI Player for MIDI files */}
            {file.type === "midi" && (
              <MidiPlayer
                url={file.url}
                trackId={file.trackId}
                startTime={file.startTime}
                duration={file.duration}
                isPlaying={isPlaying}
                currentTime={currentTime}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineRuler({
  playing,
  currentTime,
  duration,
  onSeek,
  onScroll,
  scrollPosition,
}: {
  playing: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollPosition: number;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate number of markers needed based on duration
  const markerCount = useMemo(() => {
    // Ensure markerCount is always a valid positive integer
    // Default to 60 seconds (as per requirements) if duration is invalid
    return Math.max(
      1,
      Math.ceil(isNaN(duration) || duration <= 0 ? 60 : duration)
    );
  }, [duration]);

  const timeMarkers = useMemo(() => {
    try {
      // Ensure we're creating an array with valid length
      const count = Math.max(1, Math.floor(markerCount));
      return Array.from({ length: count }, (_, i) => i);
    } catch (error) {
      console.error("Error creating time markers:", error);
      // Fallback to a safe default
      return [0]; // At least one marker
    }
  }, [markerCount]);

  const minorMarkers = useMemo(() => {
    try {
      return Array.from({ length: 4 }, (_, i) => i);
    } catch (error) {
      console.error("Error creating minor markers:", error);
      return [0]; // Fallback
    }
  }, []);

  const playheadPosition = useMemo(() => {
    return currentTime * 100;
  }, [currentTime]);

  // Keep timeline ruler in sync with tracks
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (playing || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = Math.max(
        0,
        Math.min(
          e.clientX - rect.left + scrollLeft,
          timelineRef.current.scrollWidth
        )
      );
      onSeek(x / 100); // Convert pixels to seconds (100px = 1s)

      // Auto-scroll when dragging near edges
      const edgeThreshold = 50;
      if (e.clientX - rect.left < edgeThreshold) {
        timelineRef.current.scrollLeft -= 10;
      } else if (rect.right - e.clientX < edgeThreshold) {
        timelineRef.current.scrollLeft += 10;
      }
    },
    [playing, onSeek]
  );

  // Auto-scroll to playhead when it goes out of view
  useEffect(() => {
    if (!timelineRef.current || !playing) return;
    const timeline = timelineRef.current;
    const playheadX = playheadPosition;

    if (
      playheadX < timeline.scrollLeft ||
      playheadX > timeline.scrollLeft + timeline.clientWidth
    ) {
      const newScrollLeft = playheadX - timeline.clientWidth / 2;
      timeline.scrollLeft = newScrollLeft;
      onScroll({
        currentTarget: { scrollLeft: newScrollLeft },
      } as React.UIEvent<HTMLDivElement>);
    }
  }, [playheadPosition, playing, onScroll]);

  return (
    <div
      ref={timelineRef}
      className="w-full h-[4rem] bg-neutral-800/50 text-white border-b border-neutral-700 relative select-none overflow-x-auto"
      onClick={handleTimelineClick}
      onScroll={onScroll}
    >
      <div
        className="absolute inset-0 flex items-end"
        style={{ minWidth: `${markerCount * 100}px` }}
      >
        {timeMarkers.map((marker) => (
          <div
            key={marker}
            className="flex-shrink-0 flex flex-col items-center relative"
            style={{ width: "100px" }}
          >
            {/* Major marker */}
            <div className="w-px bg-neutral-600 h-4 mb-1" />
            <div className="text-xs text-neutral-400 mb-2 font-medium">
              {String(Math.floor(marker / 60)).padStart(2, "0")}:
              {String(marker % 60).padStart(2, "0")}
            </div>
            {/* Minor markers */}
            <div className="absolute top-0 left-0 right-0 flex justify-between px-5">
              {minorMarkers.map((minor) => (
                <div
                  key={minor}
                  className="w-px bg-neutral-700 h-2"
                  style={{
                    transform: `translateX(${(minor + 1) * 20}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Playhead
        position={playheadPosition}
        isPlaying={playing}
        onSeek={onSeek}
      />
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-neutral-700/0 hover:bg-neutral-700/10 transition-colors duration-200" />
    </div>
  );
}

function Playhead({
  position,
  isPlaying,
  onSeek,
}: {
  position: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !playheadRef.current) return;
      const timeline = playheadRef.current.parentElement;
      if (!timeline) return;

      const rect = timeline.getBoundingClientRect();
      const scrollLeft = timeline.scrollLeft;
      const x = Math.max(
        0,
        Math.min(e.clientX - rect.left + scrollLeft, timeline.scrollWidth)
      );
      onSeek(x / 100); // Convert pixels to seconds (100px = 1s)

      // Auto-scroll when dragging near edges
      const edgeThreshold = 50;
      if (e.clientX - rect.left < edgeThreshold) {
        timeline.scrollLeft -= 10;
      } else if (rect.right - e.clientX < edgeThreshold) {
        timeline.scrollLeft += 10;
      }
    },
    [isDragging, onSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={playheadRef}
      className={`absolute top-0 bottom-0 w-0.5 bg-[#bca6cf] z-10 transition-transform ${
        isDragging || isPlaying
          ? "duration-[20ms] ease-linear"
          : "duration-200 ease-out"
      } cursor-ew-resize group`}
      style={{
        transform: `translateX(${position}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`w-3 h-3 bg-[#bca6cf] rounded-full -translate-x-1/2 absolute -bottom-1.5 shadow-lg transition-transform ${
          isDragging ? "scale-150" : "group-hover:scale-125"
        }`}
      />
      {/* Hover guide */}
      <div
        className={`absolute inset-y-0 left-1/2 w-px bg-[#bca6cf] opacity-0 transition-opacity ${
          isDragging
            ? "opacity-20 h-screen -top-screen"
            : "group-hover:opacity-10"
        }`}
      />
    </div>
  );
}
