"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { BsUpload } from "react-icons/bs";
import React, { useCallback } from "react";

interface ManageFilesModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function ManageFilesModal({
  isOpen,
  onOpenChange,
}: ManageFilesModalProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    console.log("Dropped files:", files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      console.log("Selected files:", files);
    },
    []
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        base: "bg-neutral-900 text-white fixed max-w-xl rounded-3xl p-2",
        closeButton: "text-white hover:bg-neutral-800",
        backdrop: "bg-black/50 backdrop-blur-sm fixed inset-0",
        wrapper: "fixed inset-0",
      }}
      size="lg"
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 mt-4">
              <h2 className="text-2xl font-bold">Manage Audio Files</h2>
              <p className="text-sm text-neutral-400">
                Upload and manage your audio files
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <BsUpload className="text-4xl mx-auto mb-4 text-neutral-400" />
                  <p className="text-lg font-medium">Drop audio files here</p>
                  <p className="text-sm text-neutral-400">
                    or click to select files
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept="audio/wav,audio/mp3,audio/mpeg,audio/ogg,audio/aac,audio/m4a"
                    multiple
                    onChange={handleFileSelect}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-medium">Your Files</h3>
                  <div className="bg-neutral-800 rounded-lg p-4 min-h-[200px]">
                    <p className="text-neutral-400 text-center">
                      No files uploaded yet
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="mb-4 mt-4">
              <Button
                color="default"
                variant="flat"
                onPress={onClose}
                className="text-white bg-neutral-800 hover:bg-[#bca6cf] transition-colors rounded-2xl px-8 py-5 text-lg font-medium items-center justify-center flex text-center"
                size="lg"
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
