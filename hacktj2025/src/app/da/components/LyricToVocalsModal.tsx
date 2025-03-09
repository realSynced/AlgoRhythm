import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Textarea,
} from "@heroui/react";

interface LyricToVocalsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  onGenerateVocals: (lyrics: string) => void;
}

export function LyricToVocalsModal({
  isOpen,
  onOpenChange,
  onClose,
  onGenerateVocals,
}: LyricToVocalsModalProps) {
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateClick = () => {
    if (!lyrics.trim()) return;

    setIsGenerating(true);

    // Call the parent component's handler
    onGenerateVocals(lyrics);

    // Reset state
    setTimeout(() => {
      setIsGenerating(false);
      onClose();
      setLyrics("");
    }, 1000);
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
            <Textarea
              label="Lyrics"
              placeholder="Enter your lyrics here..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[200px] bg-neutral-800 border-neutral-700 text-white"
            />

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
