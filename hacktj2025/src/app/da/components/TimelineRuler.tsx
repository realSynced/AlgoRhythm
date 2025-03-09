import React, { useRef, useEffect } from 'react';

interface TimelineRulerProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollPosition: number;
}

export default function TimelineRuler({
  playing,
  currentTime,
  duration,
  onSeek,
  onScroll,
  scrollPosition,
}: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate time markers
  const markers = Array.from({ length: Math.ceil(duration) }, (_, i) => ({
    time: i,
    major: i % 1 === 0, // Major marker every second
  }));

  const handleClick = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + scrollPosition;
    const clickedTime = Math.max(0, offsetX / 100); // 100px per second
    onSeek(clickedTime);
  };

  return (
    <div
      ref={rulerRef}
      className="h-8 bg-neutral-800 relative select-none overflow-hidden"
      onClick={handleClick}
      onScroll={onScroll}
    >
      {/* Time markers */}
      {markers.map(({ time, major }) => (
        <React.Fragment key={time}>
          <div
            className="absolute h-full flex items-end pb-1"
            style={{ left: `${time * 100}px` }}
          >
            <div className="h-3 w-px bg-neutral-600" />
            {major && (
              <span className="absolute bottom-1 left-1 text-xs text-neutral-400">
                {formatTime(time)}
              </span>
            )}
          </div>
          {/* Minor markers */}
          {major && [...Array(4)].map((_, i) => (
            <div
              key={`${time}-${i}`}
              className="absolute h-2 w-px bg-neutral-700"
              style={{ left: `${time * 100 + ((i + 1) * 20)}px` }}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-px bg-[#bca6cf] shadow-[0_0_10px_rgba(188,166,207,0.5)] z-10"
        style={{
          left: `${currentTime * 100}px`,
          transition: playing ? 'none' : 'left 0.1s ease-out',
        }}
      >
        <div className="w-3 h-3 bg-[#bca6cf] absolute -top-1 -translate-x-1/2 rounded-full" />
      </div>
    </div>
  );
}
