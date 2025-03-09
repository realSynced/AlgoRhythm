import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Progress,
} from "@heroui/react";
import {
  generateVocalsWithSuno,
  checkGenerationStatus,
} from "@/app/utils/sunoApi";

interface LyricToVocalsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  onGenerateVocals: (lyrics: string) => void;
}

// Music styles available in Suno
const VOCAL_STYLES = [
  { value: "Pop", label: "Pop" },
  { value: "R&B", label: "R&B" },
  { value: "Rock", label: "Rock" },
  { value: "Hip Hop", label: "Hip Hop" },
  { value: "Country", label: "Country" },
  { value: "Electronic", label: "Electronic" },
  { value: "Jazz", label: "Jazz" },
  { value: "Folk", label: "Folk" },
  { value: "Classical", label: "Classical" },
];

export function LyricToVocalsModal({
  isOpen,
  onOpenChange,
  onClose,
  onGenerateVocals,
}: LyricToVocalsModalProps) {
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("Pop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState("");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");

  // Poll for generation status when we have an active generation
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    const RETRY_DELAY = 5000; // 5 seconds

    if (generationId && isGenerating) {
      intervalId = setInterval(async () => {
        try {
          const statusResponse = await checkGenerationStatus(generationId);
          
          console.log("Status response:", statusResponse);
          
          // If we get an error status but it's a 404, it might just be that the task
          // is still being processed and not available in the API yet
          if (statusResponse.status === "error" && statusResponse.error?.includes("404")) {
            retryCount++;
            console.log(`Task not found yet, retry ${retryCount}/${MAX_RETRIES}`);
            
            // Show processing status while we wait
            setGenerationStatus("initializing");
            setGenerationProgress(25 + (retryCount * 5)); // Increment progress slightly
            
            // If we've tried too many times, assume there's a real problem
            if (retryCount >= MAX_RETRIES) {
              setGenerationError("Task not found after multiple attempts. The generation may have failed.");
              setIsGenerating(false);
              clearInterval(intervalId);
            }
            return;
          }
          
          // Reset retry count if we get a valid response
          retryCount = 0;
          setGenerationStatus(statusResponse.status);
          
          // Update progress based on status
          if (statusResponse.status === "processing") {
            setGenerationProgress(50); // Halfway there
          } else if (statusResponse.status === "completed" || statusResponse.status === "success") {
            setGenerationProgress(100);
            setIsGenerating(false);
            
            if (statusResponse.url) {
              setGeneratedAudioUrl(statusResponse.url);
              // Call the parent component's handler with the URL
              onGenerateVocals(statusResponse.url);
              
              // Reset after a delay
              setTimeout(() => {
                onClose();
                resetForm();
              }, 2000);
            } else {
              setGenerationError("No audio URL in completed response");
            }
          } else if (
            statusResponse.status === "failed" ||
            statusResponse.status === "error"
          ) {
            setGenerationError(statusResponse.error || "Generation failed");
            setIsGenerating(false);
            setGenerationProgress(0);
          }
        } catch (error) {
          console.error("Error checking generation status:", error);
          retryCount++;
          
          // Only show error to user after multiple failures
          if (retryCount >= MAX_RETRIES) {
            setGenerationError("Failed to check generation status after multiple attempts");
            setIsGenerating(false);
          }
        }
      }, RETRY_DELAY);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [generationId, isGenerating, onClose, onGenerateVocals]);

  const resetForm = () => {
    setLyrics("");
    setTitle("");
    setStyle("Pop");
    setGenerationId("");
    setGenerationStatus("");
    setGenerationProgress(0);
    setGenerationError("");
    setGeneratedAudioUrl("");
  };

  const handleGenerateClick = async () => {
    if (!lyrics.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationError("");

    try {
      const response = await generateVocalsWithSuno(lyrics, {
        style,
        title: title || "Generated Vocals",
        instrumental: false,
      });
      
      // Check if response has an id (which is the task/generation ID)
      if (response.id) {
        setGenerationId(response.id);
        setGenerationStatus("started");
        setGenerationProgress(25);
      } else {
        console.error("Failed to start generation:", response);
        throw new Error(response.error || "Failed to start generation");
      }
    } catch (error) {
      console.error("Error generating vocals:", error);
      setGenerationError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        base: "bg-neutral-900 text-white border border-neutral-700",
        header: "border-b border-neutral-800",
        footer: "border-t border-neutral-800",
        wrapper: "flex items-center justify-center min-h-screen",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Lyric to Vocals</h3>
          <p className="text-sm text-neutral-400">
            Enter lyrics to generate AI vocals for your track
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Track Title</label>
              <input
                type="text"
                placeholder="Enter a title for your vocal track"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Vocal Style</label>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full bg-neutral-800 border border-neutral-700 text-white text-left justify-between"
                    variant="bordered"
                  >
                    {style}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Vocal Styles"
                  className="bg-neutral-800 border border-neutral-700 text-white"
                  onAction={(key) => setStyle(key as string)}
                >
                  {VOCAL_STYLES.map((vocalStyle) => (
                    <DropdownItem
                      key={vocalStyle.value}
                      className="text-white hover:bg-neutral-700"
                    >
                      {vocalStyle.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            <Textarea
              label="Lyrics"
              placeholder="Enter your lyrics here..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[200px] bg-neutral-800 border-neutral-700 text-white"
            />

            {isGenerating && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm">Generating vocals...</span>
                  <span className="text-sm">{generationProgress}%</span>
                </div>
                <Progress
                  value={generationProgress}
                  color="primary"
                  className="h-2"
                  classNames={{
                    indicator: "bg-[#bca6cf]",
                    track: "bg-neutral-700",
                  }}
                />
                <p className="text-xs text-neutral-400">
                  {generationStatus === "started" && "Starting generation..."}
                  {generationStatus === "processing" && "Creating your vocals..."}
                  {(generationStatus === "completed" || generationStatus === "success") && 
                    "Vocals generated successfully!"}
                  {generationStatus === "initializing" && 
                    `Initializing generation... (${Math.round(generationProgress)}%)`}
                </p>
              </div>
            )}

            {generationError && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-md">
                <p className="text-red-400 text-sm">{generationError}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium">Tips:</h4>
              <ul className="text-xs text-neutral-400 list-disc pl-4">
                <li>Add line breaks for verse/chorus separation</li>
                <li>Keep lyrics concise for better results</li>
                <li>Specify melody notes in brackets if needed [C4, E4, G4]</li>
              </ul>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            className="text-neutral-400 hover:text-neutral-200"
            isDisabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleGenerateClick}
            className="bg-[#bca6cf] text-white hover:bg-[#bca6cf]/80 rounded-full"
            isLoading={isGenerating}
            isDisabled={!lyrics.trim() || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Vocals"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default LyricToVocalsModal;
