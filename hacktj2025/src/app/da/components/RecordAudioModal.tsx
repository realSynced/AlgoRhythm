import React, { useState, useRef } from "react";
import { Modal, Button } from "@nextui-org/react";
import { BsRecordFill, BsStopFill } from "react-icons/bs";

interface RecordAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioRecorded: (audioFile: File) => void;
}

export default function RecordAudioModal({
  isOpen,
  onClose,
  onAudioRecorded,
}: RecordAudioModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleRecord = async () => {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: "audio/wav",
        });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, {
          type: "audio/wav",
        });
        onAudioRecorded(audioFile);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        onClose();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "16px" }}>
        <h4>Record Audio</h4>
        <Button
          auto
          color={isRecording ? "danger" : "primary"}
          icon={isRecording ? <BsStopFill /> : <BsRecordFill />}
          onClick={handleRecord}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>
    </Modal>
  );
}
