import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Button,
  Form,
  Container,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
} from "react-bootstrap";
import VoiceRecognition from "./VoiceRecognition";
import EmojiPicker from "emoji-picker-react";

const socket = io.connect(process.env.REACT_APP_BACKEND_URL);
socket.on("connect", () => {
  console.log("connected with id: " + socket.id);
});

socket.on("receive-message", (message) => {
  console.log(message);
});

export default function Chatroom() {
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    socket.on("receive-message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() !== "" || voiceTranscript.trim() !== "") {
      const messageToSend = inputMessage.trim() || voiceTranscript.trim();
      socket.emit("send-message", { inputMessage: messageToSend, topic });
      setInputMessage("");
      setVoiceTranscript("");
    }
  };

  const createTopic = () => {
    if (topic.trim() !== "") {
      socket.emit("createTopic", topic);
    }
  };

  const handleVoiceTranscriptChange = (transcript) => {
    setVoiceTranscript(transcript);
  };

  const insertEmoji = (emojiData) => {
    const inputRef = textareaRef.current;

    if (inputRef) {
      const startPos = inputRef.selectionStart;
      const endPos = inputRef.selectionEnd;
      const inputValue = inputRef.value;
      const emoji = String.fromCodePoint(parseInt(emojiData.unified, 16));
      const updatedValue =
        inputValue.substring(0, startPos) +
        emoji +
        inputValue.substring(endPos);

      setInputMessage(updatedValue);
      inputRef.focus();
      inputRef.setSelectionRange(startPos + 2, startPos + 2);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <Container className="chatroom-container">
      <h4>Instructions: </h4>
      <ListGroup as="ol" numbered>
        <ListGroupItem as="li">Create a topic</ListGroupItem>
        <ListGroupItem as="li">Send a message</ListGroupItem>
        <ListGroupItem as="li">
          Get 'matched' if at least 2 of you enter the exact same topic
        </ListGroupItem>
      </ListGroup>
      <br />

      <Row>
        <Col md={4} className="topic-form">
          <h6>Your ID is {socket.id}</h6>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter a topic"
              value={topic}
              onChange={({ target }) => setTopic(target.value)}
              required
            />
          </Form.Group>

          <Button onClick={createTopic} className="special-button">
            Create Topic
          </Button>
        </Col>

        <Col md={8} className="message-form">
          <Form.Group className="mb-3 position-relative">
            <Form.Control
              as="textarea"
              type="text"
              placeholder="Enter your message"
              value={inputMessage}
              onChange={({ target }) => setInputMessage(target.value)}
              required
              ref={textareaRef}
              style={{ paddingRight: "40px" }}
            />

            {showEmojiPicker && <EmojiPicker onEmojiClick={insertEmoji} />}

            <Button
              variant="transparent"
              className="position-absolute bottom-0 end-0 mb-2 me-2"
              onClick={toggleEmojiPicker}
            >
              😃
            </Button>
          </Form.Group>

          <VoiceRecognition onTranscriptChange={handleVoiceTranscriptChange} />

          <Button onClick={sendMessage} className="special-button">
            Send
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={12} className="message-list">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <strong>{message.sender}: </strong> {message.message}
            </div>
          ))}
        </Col>
      </Row>
    </Container>
  );
}
