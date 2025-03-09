"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import ManageFilesModal from "../components/ManageFilesModal";

interface Track {
  id: number;
  name: string;
  trackType: string;
}

export default function CreateMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60); // Default duration 60 seconds
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
    setTimeline(timeline.filter((item) => item.trackId !== id));
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

  const handleAddFile = () => {
    const newTrack: Track = {
      id: Date.now(),
      name: `Track ${tracks.length + 1}`,
      trackType: "File",
    };
    setTracks([...tracks, newTrack]);
    setSelectedTrack(newTrack);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleRecord = () => {
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((time) => {
          if (time >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return time + 0.02; // Update every 20ms for smoother animation
        });
      }, 20);
      setTimer(interval);
    } else if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, duration]);

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

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

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
            <div className="flex items-center gap-2 w-1/3">
              {/* Undo and Redo buttons */}
              <div className="flex items-center w-max bg-neutral-800 rounded-full">
                <button className="rounded-l-full p-3 hover:bg-[#bca6cf] transition-colors">
                  <GrUndo className="text-3xl" />
                </button>
                <button className="rounded-r-full p-3 hover:bg-[#bca6cf] transition-colors">
                  <GrRedo className="text-3xl" />
                </button>
              </div>
              {/* Music controls */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center bg-neutral-800 rounded-full">
                  <button className="p-3 hover:bg-[#bca6cf] transition-colors rounded-l-full">
                    <BsSkipStartFill className="text-3xl" />
                  </button>
                  <button
                    className="p-3 hover:bg-[#bca6cf] transition-colors"
                    onClick={handlePlay}
                  >
                    <BsPlayFill className="text-3xl" />
                  </button>
                  <button
                    className="p-3 hover:bg-[#bca6cf] transition-colors"
                    onClick={handlePause}
                  >
                    <BsPauseFill className="text-3xl" />
                  </button>
                  <button
                    className="p-3 hover:bg-[#bca6cf] transition-colors"
                    onClick={handleStop}
                  >
                    <BsStopFill className="text-3xl" />
                  </button>
                  <button
                    className="p-3 hover:bg-[#bca6cf] transition-colors rounded-r-full"
                    onClick={handleRecord}
                  >
                    <BsRecordFill className="text-3xl text-red-500" />
                  </button>
                </div>
              </div>
              {/* Timer that starts when play is clicked */}
              <div className="flex items-center bg-neutral-800 rounded-full px-4 ml-4">
                <div className="text-neutral-400 mr-2 text-sm font-medium tracking-wider">
                  TIME
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    className="w-14 text-xl font-mono bg-transparent outline-none text-center py-3  hover:text-white transition-colors rounded-l-full cursor-pointer focus:text-white"
                    value={
                      formatTime(currentTime).minutes +
                      ":" +
                      formatTime(currentTime).seconds
                    }
                    readOnly
                  />
                  <span className="text-xl font-mono text-neutral-400">:</span>
                  <input
                    type="text"
                    className="w-12 text-xl font-mono bg-transparent outline-none text-center py-3  hover:text-white transition-colors rounded-r-full cursor-pointer focus:text-white"
                    value={formatTime(currentTime).centiseconds}
                    readOnly
                  />
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
                      className="flex items-center rounded-full px-3 py-1 font-bold text-white bg-neutral-800 hover:bg-neutral-700"
                    >
                      <BsPlus className="text-3xl" /> Add Track
                    </button>
                    <button
                      onClick={onOpen}
                      className="flex items-center rounded-full px-3 py-1 font-bold text-white bg-neutral-800 hover:bg-neutral-700"
                    >
                      <BsPlus className="text-3xl" /> Manage Files
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {tracks.map((track) => (
                      <TrackLeftDesign
                        key={track.id}
                        id={track.id}
                        name={track.name}
                        trackType={track.trackType}
                        onDelete={handleDeleteTrack}
                        onUpdateName={handleUpdateTrackName}
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
                  duration={duration}
                  onSeek={handleSeek}
                />
                <div className="flex flex-col gap-0.5">
                  {tracks.map((track) => (
                    <Timeline key={track.id} files={timeline} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ManageFilesModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}

function TrackLeftDesign({
  id,
  name,
  trackType,
  onDelete,
  onUpdateName,
}: {
  id: number;
  name: string;
  trackType: string;
  onDelete: (id: number) => void;
  onUpdateName: (id: number, name: string) => void;
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
      className={`w-full h-[8rem] bg-neutral-800 text-white transition-all duration-200 ${isDeleting ? "opacity-50 scale-95" : "hover:bg-neutral-700"}`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
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
                {isEditing && (
                  <div className="absolute -bottom-4 right-0 text-xs text-neutral-400">
                    {10 - inputValue.length} chars left
                  </div>
                )}
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
            <p>Track Type: {trackType}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeline({ files }: { files: any[] }) {
  return (
    <div className="w-full h-[8rem] bg-neutral-800 text-white hover:bg-neutral-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex justify-between w-full items-center"></div>
      </div>
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
  onSeek: (position: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !playheadRef.current) return;
    const timeline = playheadRef.current.parentElement;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const scrollLeft = timeline.scrollLeft;
    const x = Math.max(0, Math.min(e.clientX - rect.left + scrollLeft, timeline.scrollWidth));
    onSeek(x / 100); // Convert pixels to seconds (100px = 1s)

    // Auto-scroll when dragging near edges
    const edgeThreshold = 50;
    if (e.clientX - rect.left < edgeThreshold) {
      timeline.scrollLeft -= 10;
    } else if (rect.right - e.clientX < edgeThreshold) {
      timeline.scrollLeft += 10;
    }
  }, [isDragging, onSeek]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={playheadRef}
      className={`absolute top-0 bottom-0 w-0.5 bg-[#bca6cf] z-10 transition-transform ${
        isDragging || isPlaying ? 'duration-[20ms] ease-linear' : 'duration-200 ease-out'
      } cursor-ew-resize group`}
      style={{
        transform: `translateX(${position}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`w-3 h-3 bg-[#bca6cf] rounded-full -translate-x-1/2 absolute -bottom-1.5 shadow-lg transition-transform ${
        isDragging ? 'scale-150' : 'group-hover:scale-125'
      }`} />
      {/* Hover guide */}
      <div className={`absolute inset-y-0 left-1/2 w-px bg-[#bca6cf] opacity-0 transition-opacity ${
        isDragging ? 'opacity-20 h-screen -top-screen' : 'group-hover:opacity-10'
      }`} />
    </div>
  );
}

function TimelineRuler({
  playing,
  currentTime,
  duration,
  onSeek,
}: {
  playing: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const timeMarkers = Array.from({ length: 60 }, (_, i) => i);
  const minorMarkers = Array.from({ length: 4 }, (_, i) => i);
  const timelineRef = useRef<HTMLDivElement>(null);

  const playheadPosition = useMemo(() => {
    return currentTime * 100;
  }, [currentTime]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (playing || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = Math.max(0, Math.min(e.clientX - rect.left + scrollLeft, timelineRef.current.scrollWidth));
    onSeek(x / 100);
  }, [playing, onSeek]);

  // Auto-scroll to playhead when it goes out of view
  useEffect(() => {
    if (!timelineRef.current || !playing) return;
    const timeline = timelineRef.current;
    const playheadX = playheadPosition;
    
    if (playheadX < timeline.scrollLeft || playheadX > timeline.scrollLeft + timeline.clientWidth) {
      timeline.scrollLeft = playheadX - (timeline.clientWidth / 2);
    }
  }, [playheadPosition, playing]);

  return (
    <div 
      ref={timelineRef}
      className="w-full h-[4rem] bg-neutral-800/50 text-white border-b border-neutral-700 relative select-none"
      onClick={handleTimelineClick}
    >
      <div className="absolute inset-0 flex items-end overflow-x-auto overflow-y-hidden">
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
      <Playhead position={playheadPosition} isPlaying={playing} onSeek={onSeek} />
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-neutral-700/0 hover:bg-neutral-700/10 transition-colors duration-200" />
    </div>
  );
}
