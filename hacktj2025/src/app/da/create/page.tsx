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

import { useDisclosure } from "@nextui-org/react";
import ManageFilesModal from "@/app/da/components/ManageFilesModal";
import TrackLeftDesign from "@/app/da/components/TrackLeftDesign";
import Timeline from "@/app/da/components/Timeline";
import TimelineRuler from "@/app/da/components/TimelineRuler";
import RecordAudioModal from "@/app/da/components/RecordAudioModal";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/dropdown";

interface Track {
  id: number;
  name: string;
  trackType: string;
  typeSelected: boolean;
}

interface AudioFile {
  id: string;
  name: string;
  url: string;
  trackId: number;
  startTime: number;
  duration: number;
}

export default function CreateMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [audioElements, setAudioElements] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Calculate total duration based on audio files
  const totalDuration = useMemo(() => {
    const maxAudioEnd = audioFiles.reduce((max, file) => {
      const endTime = file.startTime + file.duration;
      return Math.max(max, endTime);
    }, 0);
    return Math.max(maxAudioEnd + 30, 60); // At least 60 seconds, plus 30 seconds buffer
  }, [audioFiles]);

  const handleFileUpload = useCallback(
    (files: File[]) => {
      if (!selectedTrack) {
        // Create a new track if none is selected
        const newTrack: Track = {
          id: Date.now(),
          name: `Track ${tracks.length + 1}`,
          trackType: "Audio",
          typeSelected: false,
        };
        setTracks((prev) => [...prev, newTrack]);

        // Create audio files for the new track
        const newAudioFiles: AudioFile[] = files.map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: URL.createObjectURL(file),
          trackId: newTrack.id,
          startTime: 0,
          duration: 0,
        }));
        setAudioFiles((prev) => [...prev, ...newAudioFiles]);

        // Load audio durations
        files.forEach((file, index) => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.addEventListener("loadedmetadata", () => {
            setAudioFiles((prev) =>
              prev.map((af, i) =>
                i === index ? { ...af, duration: audio.duration } : af
              )
            );
          });
        });
      } else {
        // Add files to selected track
        const newAudioFiles: AudioFile[] = files.map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: URL.createObjectURL(file),
          trackId: selectedTrack.id,
          startTime: 0,
          duration: 0,
        }));
        setAudioFiles((prev) => [...prev, ...newAudioFiles]);

        // Load audio durations
        files.forEach((file, index) => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.addEventListener("loadedmetadata", () => {
            setAudioFiles((prev) =>
              prev.map((af) =>
                af.id === newAudioFiles[index].id
                  ? { ...af, duration: audio.duration }
                  : af
              )
            );
          });
        });
      }
    },
    [selectedTrack, tracks.length]
  );

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: Date.now(),
      name: `Track ${tracks.length + 1}`,
      trackType: "Audio",
      typeSelected: false,
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
        track.id === id
          ? { ...track, trackType: type, typeSelected: true }
          : track
      )
    );
  };

  // Handle recording
  const handleRecord = async () => {
    if (!selectedTrack || selectedTrack.trackType !== "Vocal") return;

    try {
      if (!isRecording) {
        // Start recording
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
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = (Date.now() - recordingStartTime) / 1000;

          // Add the recorded audio to the track
          const newAudioFile: AudioFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: `recording-${Date.now()}.wav`,
            url: audioUrl,
            trackId: selectedTrack.id,
            startTime: currentTime,
            duration: duration,
          };

          setAudioFiles((prev) => [...prev, newAudioFile]);

          // Create audio element for playback
          const audio = new Audio(audioUrl);
          setAudioElements((prev) => ({ ...prev, [newAudioFile.id]: audio }));

          // Clean up
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
          setRecordingStartTime(0);
        };

        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingStartTime(Date.now());

        // Start the timer to show recording progress
        const recordingTimer = setInterval(() => {
          setCurrentTime((time) => {
            // Stop recording if we hit the end of the timeline
            if (time >= totalDuration) {
              if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
              ) {
                mediaRecorderRef.current.stop();
                clearInterval(recordingTimer);
              }
              return totalDuration;
            }
            return time + 0.1;
          });
        }, 100);
        setTimer(recordingTimer);
      } else {
        // Stop recording
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }

        if (timer) {
          clearInterval(timer);
          setTimer(null);
        }
      }
    } catch (error) {
      console.error("Error recording:", error);
      setIsRecording(false);
      setRecordingStartTime(0);

      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    }
  };

  const handleOpenRecordModal = () => {
    setIsRecordModalOpen(true);
  };

  const handleCloseRecordModal = () => {
    setIsRecordModalOpen(false);
  };

  const handleAudioRecorded = (audioFile: File) => {
    // Process the audio file and add it to the timeline
    const newAudioFile: AudioFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: audioFile.name,
      url: URL.createObjectURL(audioFile),
      trackId: selectedTrack?.id || 0,
      startTime: currentTime,
      duration: 0, // Will be updated once loaded
    };

    setAudioFiles((prev) => [...prev, newAudioFile]);
  };

  // Handle playback
  useEffect(() => {
    if (isPlaying) {
      // Start playback timer
      const playbackTimer = setInterval(() => {
        setCurrentTime((time) => {
          if (time >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return time + 0.1;
        });
      }, 100);

      // Play all audio files that should be playing at current time
      audioFiles.forEach((file) => {
        const audio = audioElements[file.id];
        if (!audio) {
          // Create new audio element if it doesn't exist
          const newAudio = new Audio(file.url);
          setAudioElements((prev) => ({ ...prev, [file.id]: newAudio }));
          return;
        }

        const relativeTime = currentTime - file.startTime;
        if (relativeTime >= 0 && relativeTime < file.duration) {
          // Audio should be playing
          if (audio.paused) {
            audio.currentTime = relativeTime;
            audio.play().catch(console.error);
          }
        } else {
          // Audio should not be playing
          if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      });

      return () => {
        clearInterval(playbackTimer);
        // Pause all audio when cleaning up
        Object.values(audioElements).forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
      };
    } else {
      // When not playing, pause all audio
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }, [isPlaying, currentTime, audioFiles, audioElements, totalDuration]);

  // Load audio elements when files change
  useEffect(() => {
    const newElements: { [key: string]: HTMLAudioElement } = {};

    audioFiles.forEach((file) => {
      if (!audioElements[file.id]) {
        const audio = new Audio(file.url);
        audio.addEventListener("loadedmetadata", () => {
          setAudioFiles((prev) =>
            prev.map((af) =>
              af.id === file.id ? { ...af, duration: audio.duration } : af
            )
          );
        });
        newElements[file.id] = audio;
      }
    });

    if (Object.keys(newElements).length > 0) {
      setAudioElements((prev) => ({ ...prev, ...newElements }));
    }

    return () => {
      // Cleanup audio elements
      Object.values(newElements).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [audioFiles]);

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsRecording(false);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    Object.values(audioElements).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (isPlaying) {
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  };

  const handleFileDrop = useCallback(
    (trackId: number, files: FileList) => {
      const audioFiles = Array.from(files).filter((file) =>
        [
          "audio/wav",
          "audio/mp3",
          "audio/mpeg",
          "audio/ogg",
          "audio/aac",
          "audio/m4a",
        ].includes(file.type)
      );
      handleFileUpload(audioFiles);
    },
    [handleFileUpload]
  );

  // Handle audio movement
  const handleAudioMove = useCallback(
    (fileId: string, newStartTime: number) => {
      setAudioFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, startTime: newStartTime } : file
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
          </div>
          <div className="mb-auto flex flex-col items-center space-y-6 gap-2 w-full h-full">
            <input
              className="text-4xl font-bold bg-transparent border-b-2 border-neutral-300 outline-none "
              placeholder="New Project"
              type="text"
            />
            <div className="flex items-center justify-center space-x-6 py-4 -translate-y-4">
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
                  className={`p-3 transition-all duration-200 ${isRecording ? "bg-red-500 text-white" : "hover:bg-[#bca6cf]/20 text-white"}`}
                  onClick={() => {
                    setIsRecordModalOpen(true);
                  }}
                >
                  <BsRecordFill className="text-3xl" />
                </button>
                <div className="w-px h-8 bg-neutral-700/30" />
                <button
                  className="p-3 transition-all duration-200 hover:bg-[#bca6cf]/20 text-white"
                  onClick={handleStop}
                >
                  <BsStopFill className="text-3xl" />
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
                      onClick={onOpen}
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
                        typeSelected={track.typeSelected}
                        isSelected={selectedTrack?.id === track.id}
                        isRecording={
                          isRecording && selectedTrack?.id === track.id
                        }
                        onSelect={() => setSelectedTrack(track)}
                        onDelete={handleDeleteTrack}
                        onUpdateName={handleUpdateTrackName}
                        onUpdateTrackType={handleUpdateTrackType}
                        onRecord={handleRecord}
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
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        projectId={4}
        onFileUpload={handleFileUpload}
      />
      <RecordAudioModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onAudioRecorded={handleAudioRecorded}
      />
    </>
  );
}
