import React, { useRef } from 'react';

interface TimelineProps {
  trackId: number;
  files: {
    id: string;
    name: string;
    startTime: number;
    duration: number;
  }[];
  onFileDrop: (trackId: number, files: FileList) => void;
  onAudioMove: (fileId: string, newStartTime: number) => void;
}

export default function Timeline({
  trackId,
  files,
  onFileDrop,
  onAudioMove,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.style.backgroundColor = 'rgba(188, 166, 207, 0.1)';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    target.style.backgroundColor = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length > 0) {
      onFileDrop(trackId, e.dataTransfer.files);
    }
  };

  const handleAudioDragStart = (e: React.DragEvent<HTMLDivElement>, fileId: string) => {
    e.dataTransfer.setData('text/plain', fileId);
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (!fileId || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newStartTime = Math.max(0, Math.round(offsetX / 100)); // 100px per second
    onAudioMove(fileId, newStartTime);
  };

  return (
    <div
      ref={timelineRef}
      className="h-[4rem] bg-neutral-900 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.map((file) => (
        <div
          key={file.id}
          className="absolute h-full bg-[#bca6cf] rounded-lg cursor-move flex items-center px-2 overflow-hidden"
          style={{
            left: `${file.startTime * 100}px`,
            width: `${file.duration * 100}px`,
          }}
          draggable
          onDragStart={(e) => handleAudioDragStart(e, file.id)}
        >
          <span className="text-sm font-medium text-neutral-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {file.name}
          </span>
        </div>
      ))}
    </div>
  );
}
