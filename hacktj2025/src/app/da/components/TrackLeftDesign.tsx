import React, { useState } from 'react';
import { BsRecordFill, BsTrash } from 'react-icons/bs';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';

interface TrackLeftDesignProps {
  id: number;
  name: string;
  trackType: string;
  typeSelected: boolean;
  isSelected: boolean;
  isRecording: boolean;
  onSelect: () => void;
  onDelete: (id: number) => void;
  onUpdateName: (id: number, name: string) => void;
  onUpdateTrackType: (id: number, type: string) => void;
  onRecord: () => void;
}

export default function TrackLeftDesign({
  id,
  name,
  trackType,
  typeSelected,
  isSelected,
  isRecording,
  onSelect,
  onDelete,
  onUpdateName,
  onUpdateTrackType,
  onRecord,
}: TrackLeftDesignProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleNameSubmit = () => {
    onUpdateName(id, editName);
    setIsEditing(false);
  };

  return (
    <div
      className={`h-[4rem] flex items-center justify-between px-4 gap-2 ${
        isSelected ? 'bg-neutral-800' : 'bg-neutral-900'
      } hover:bg-neutral-800 transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        {isEditing ? (
          <input
            className="bg-neutral-700 text-white px-2 py-1 rounded"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            autoFocus
          />
        ) : (
          <span
            className="font-medium"
            onDoubleClick={() => setIsEditing(true)}
          >
            {name}
          </span>
        )}
        {!typeSelected ? (
          <Dropdown>
            <DropdownTrigger>
              <button className="px-2 py-1 text-sm bg-neutral-700 rounded hover:bg-neutral-600">
                {trackType || 'Select Type'}
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Track Type Selection"
              onAction={(key) => onUpdateTrackType(id, key as string)}
            >
              <DropdownItem key="Audio">Audio</DropdownItem>
              <DropdownItem key="Vocal">Vocal</DropdownItem>
              <DropdownItem key="MIDI">MIDI</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <span className="px-2 py-1 text-sm bg-neutral-700 rounded">
            {trackType}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {trackType === 'Vocal' && (
          <button
            className={`p-2 rounded-full transition-all ${
              isRecording
                ? 'bg-red-500 text-white scale-110'
                : 'bg-neutral-700 hover:bg-red-500/20 hover:text-red-500'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onRecord();
            }}
          >
            <BsRecordFill className="text-lg" />
          </button>
        )}
        <button
          className="p-2 rounded-full bg-neutral-700 hover:bg-red-500/20 hover:text-red-500 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <BsTrash className="text-lg" />
        </button>
      </div>
    </div>
  );
}
