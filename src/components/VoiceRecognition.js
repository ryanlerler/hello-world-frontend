import React, { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";

export default function VoiceRecognition({ onTranscriptChange }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [onTranscriptChange, transcript]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div>
      <p>
        <FontAwesomeIcon icon={faMicrophone} beat /> {listening ? "on" : "off"}
      </p>
      <Button
        onClick={SpeechRecognition.startListening}
        className="special-button"
      >
        Start
      </Button>
      <Button
        onClick={SpeechRecognition.stopListening}
        className="special-button"
      >
        Stop
      </Button>
      <Button onClick={resetTranscript} className="special-button">
        Reset
      </Button>
      <p>{transcript}</p>
    </div>
  );
}
