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
import { BsUpload, BsMusicNote, BsTrash } from "react-icons/bs";
import React, { useState, useCallback } from "react";

interface ManageFilesModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onFileUpload?: (files: File[]) => void;
}

export default function ManageFilesModal({
  isOpen,
  onOpenChange,
  onFileUpload,
}: ManageFilesModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      /\.(wav|mp3|ogg|aac|m4a)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert("Please upload valid audio files (WAV, MP3, OGG, AAC, M4A)");
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (onFileUpload) {
      onFileUpload(validFiles);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      /\.(wav|mp3|ogg|aac|m4a)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert("Please upload valid audio files (WAV, MP3, OGG, AAC, M4A)");
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (onFileUpload) {
      onFileUpload(validFiles);
    }
  }, [onFileUpload]);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive 
                      ? "border-[#bca6cf] bg-[#bca6cf]/10" 
                      : "border-neutral-700 hover:bg-neutral-800/50"
                  }`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <BsUpload className="text-4xl mx-auto mb-4 text-neutral-400" />
                  <p className="text-lg font-medium">Drop audio files here</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    or click to select files
                  </p>
                  <p className="text-xs text-neutral-500 mt-4">
                    Supported formats: WAV, MP3, OGG, AAC, M4A
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
                    {uploadedFiles.length === 0 ? (
                      <p className="text-neutral-400 text-center">
                        No files uploaded yet
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-[#bca6cf]">
                                <BsMusicNote className="text-xl" />
                              </div>
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-xs text-neutral-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                            >
                              <BsTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
