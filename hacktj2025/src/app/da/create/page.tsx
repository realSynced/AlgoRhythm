"use client";

import { useEffect, useState, useRef, DragEvent } from "react";
import { GrUndo } from "react-icons/gr";
import { GrRedo } from "react-icons/gr";
import {
  BsSkipStartFill,
  BsPlayFill,
  BsPauseFill,
  BsStopFill,
  BsRecordFill,
} from "react-icons/bs";

export default function CreateMusic() {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="h-[10rem] flex items-center w-full p-5 border-b border-neutral-500/50">
        <div className="mb-auto flex flex-col text-left h-full w-[28.1rem] items-start ">
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
                <button className="p-3 hover:bg-[#bca6cf] transition-colors">
                  <BsPlayFill className="text-3xl" />
                </button>
                <button className="p-3 hover:bg-[#bca6cf] transition-colors">
                  <BsPauseFill className="text-3xl" />
                </button>
                <button className="p-3 hover:bg-[#bca6cf] transition-colors">
                  <BsStopFill className="text-3xl" />
                </button>
                <button className="p-3 hover:bg-[#bca6cf] transition-colors rounded-r-full">
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
                  defaultValue="00:00"
                  readOnly
                />
                <span className="text-xl font-mono text-neutral-400">:</span>
                <input
                  type="text"
                  className="w-12 text-xl font-mono bg-transparent outline-none text-center py-3  hover:text-white transition-colors rounded-r-full cursor-pointer focus:text-white"
                  defaultValue="00.0"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center w-[full] h-full ">
        <div className="h-full w-[28.1rem] flex border-r border-neutral-500/50">
          {/* Sidebar */}
          <button className="w-full h-full font-bold text-white bg-neutral-800">
            Click anywhere to create a new track
          </button>
        </div>
        <div className=" w-full h-full">{/* Canvas track */}</div>
      </div>
    </div>
  );
}

function TrackLeftDesign({
  name,
  trackType,
}: {
  name: string;
  trackType: string;
}) {
  return <div></div>;
}
