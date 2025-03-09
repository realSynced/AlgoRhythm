"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@nextui-org/react";
import { useCallback, useState, useEffect } from "react";
import { BsUpload, BsMusicNote, BsTrash } from "react-icons/bs";
import { createClient } from "@/utils/supabase/client";

interface ManageFilesModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onFileUpload?: (files: File[], convertToMidi?: boolean) => void;
  projectId: number;
  recordedFiles?: File[];
}

interface UploadedFile {
  id: number;
  file: File;
  duration: number;
}

const supabase = createClient();

export default function ManageFilesModal({
  isOpen,
  onOpenChange,
  onFileUpload,
  projectId,
  recordedFiles = []
}: ManageFilesModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const { isOpen: isErrorOpen, onOpen: onErrorOpen, onClose: onErrorClose } = useDisclosure();
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();

  const isValidAudioFile = (file: File) => {
    const validExtensions = ['wav', 'mp3', 'ogg', 'aac', 'm4a'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    return validExtensions.includes(fileExt || '') || file.type.startsWith('audio/');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileUpload = async (files: File[]) => {
    try {
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed bottom-4 right-4 bg-neutral-800 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2';
      loadingToast.innerHTML = `
        <div class="w-4 h-4 rounded-full border-2 border-[#bca6cf] border-t-transparent animate-spin"></div>
        <span>Uploading files...</span>
      `;
      document.body.appendChild(loadingToast);

      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('audio')
          .upload(fileName, file);

        if (storageError) {
          console.error('Error uploading to storage:', storageError);
          document.body.removeChild(loadingToast);
          onErrorOpen();
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(fileName);

        // Create audio element to get duration
        const audio = new Audio(URL.createObjectURL(file));
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
          });
        });

        // Insert record into audio_files table
        const { data: dbData, error: dbError } = await supabase
          .from('audio_files')
          .insert([
            {
              name: file.name,
              url: publicUrl
            }
          ])
          .select()
          .single();

        if (dbError) {
          console.error('Error inserting into database:', dbError);
          document.body.removeChild(loadingToast);
          onErrorOpen();
          return;
        }

        // Update local state
        const newFile = new File([file], file.name, { type: file.type });
        setUploadedFiles(prev => [...prev, { 
          id: dbData.id, 
          file: newFile,
          duration
        }]);
      }
      document.body.removeChild(loadingToast);
      onSuccessOpen();
    } catch (error) {
      console.error('Error in file upload:', error);
      const loadingToast = document.querySelector('.fixed.bottom-4.right-4');
      if (loadingToast) document.body.removeChild(loadingToast);
      onErrorOpen();
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(isValidAudioFile);

      if (validFiles.length === 0) {
        onErrorOpen();
        return;
      }

      handleFileUpload(validFiles);
    },
    [onErrorOpen]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(isValidAudioFile);

        if (validFiles.length === 0) {
          onErrorOpen();
          return;
        }

        await handleFileUpload(validFiles);
      } catch (error) {
        console.error("Error uploading files:", error);
        onErrorOpen();
      }
    },
    [onErrorOpen]
  );

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
    }
  };

  const handleAddToTimeline = (index: number) => {
    const file = uploadedFiles[index];
    if (!file || !onFileUpload) return;

    onFileUpload([file.file], false);
    handleRemoveFile(index);
  };

  const handleConvertToMidi = (index: number) => {
    const file = uploadedFiles[index];
    if (!file || !onFileUpload) return;

    onFileUpload([file.file], true);
  };

  useEffect(() => {
    const processRecordedFiles = async () => {
      if (recordedFiles && recordedFiles.length > 0) {
        try {
          const loadingToast = document.createElement('div');
          loadingToast.className = 'fixed bottom-4 right-4 bg-neutral-800 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2';
          loadingToast.innerHTML = `
            <div class="w-4 h-4 rounded-full border-2 border-[#bca6cf] border-t-transparent animate-spin"></div>
            <span>Processing recorded files...</span>
          `;
          document.body.appendChild(loadingToast);

          for (const file of recordedFiles) {
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload file to Supabase Storage
            const { data: storageData, error: storageError } = await supabase.storage
              .from('audio')
              .upload(fileName, file);

            if (storageError) {
              console.error('Error uploading to storage:', storageError);
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('audio')
              .getPublicUrl(fileName);

            // Create audio element to get duration
            const audio = new Audio(URL.createObjectURL(file));
            const duration = await new Promise<number>((resolve) => {
              audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
              });
            });

            // Insert record into audio_files table
            const { data: dbData, error: dbError } = await supabase
              .from('audio_files')
              .insert([
                {
                  name: file.name,
                  url: publicUrl
                }
              ])
              .select()
              .single();

            if (dbError) {
              console.error('Error inserting into database:', dbError);
              continue;
            }

            // Update local state
            const newFile = new File([file], file.name, { type: file.type });
            setUploadedFiles(prev => [...prev, { 
              id: dbData.id, 
              file: newFile,
              duration
            }]);
          }
          
          document.body.removeChild(loadingToast);
          onSuccessOpen();
        } catch (error) {
          console.error('Error processing recorded files:', error);
          const loadingToast = document.querySelector('.fixed.bottom-4.right-4');
          if (loadingToast) document.body.removeChild(loadingToast);
          onErrorOpen();
        }
      }
    };

    if (isOpen && recordedFiles.length > 0) {
      processRecordedFiles();
      // No need to clear the recorded files reference here, it's handled in the parent component
    }
  }, [isOpen, recordedFiles, onErrorOpen, onSuccessOpen]);

  return (
    <>
      <Modal 
        isOpen={isErrorOpen} 
        onOpenChange={onErrorClose}
        classNames={{
          base: "bg-neutral-900",
          header: "border-b-[1px] border-neutral-800",
        }}
      >
        <ModalContent>
          <div className="p-4 text-red-500">
            Please upload valid audio files (WAV, MP3, OGG, AAC, M4A)
          </div>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isSuccessOpen} 
        onOpenChange={onSuccessClose}
        classNames={{
          base: "bg-neutral-900",
          header: "border-b-[1px] border-neutral-800",
        }}
      >
        <ModalContent>
          <div className="p-4 text-[#bca6cf] flex items-center gap-2">
            <div className="w-4 h-4 text-[#bca6cf]">
              <svg className="animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            Files uploaded successfully
          </div>
        </ModalContent>
      </Modal>

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
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
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

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Your Files</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {uploadedFiles.map((fileEntry, index) => (
                        <div
                          key={fileEntry.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            selectedFileIndex === index
                              ? "bg-[#bca6cf]/20"
                              : "bg-neutral-800 hover:bg-neutral-700"
                          }`}
                          onClick={() => setSelectedFileIndex(index)}
                        >
                          <div className="flex items-center gap-3">
                            <BsMusicNote className="text-xl text-[#bca6cf]" />
                            <div>
                              <p className="font-medium">{fileEntry.file.name}</p>
                              <p className="text-sm text-neutral-400">
                                {Math.round(fileEntry.duration)}s
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-[#bca6cf] text-white"
                              onClick={() => handleAddToTimeline(index)}
                            >
                              Add to Timeline
                            </Button>
                            <Button
                              size="sm"
                              className="bg-neutral-700 text-white"
                              onClick={() => handleConvertToMidi(index)}
                            >
                              Convert to MIDI
                            </Button>
                            <Button
                              isIconOnly
                              variant="light"
                              className="text-neutral-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(index);
                              }}
                            >
                              <BsTrash />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
