import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import VoiceRecognition from "./VoiceRecognition";
import { Button, Form } from "react-bootstrap";

export default function ChatGpt() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const { user } = useAuth0();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalInput = input || voiceTranscript;
    const newMessage = { role: "user", content: finalInput };

    const updatedConversation = [...messages, newMessage].map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content,
    }));

    const { data } = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/chatgpt`,
      {
        conversation: updatedConversation,
      }
    );

    setMessages([
      ...messages,
      { role: "user", content: `${user.email} - ${finalInput}` },
      { role: "model", content: ` ${data}` },
    ]);
    setInput("");
    setVoiceTranscript("");
  };

  return (
    <div>
      <h2>
        <img
          src="https://www.hausmanmarketingletter.com/wp-content/uploads/2023/05/64063dbcad97bd421b437096_chatgpt.jpg"
          alt="chatgpt"
          className="chatgpt"
        />
        ChatGPT
      </h2>
      <div>
        {messages.map((message, index) => (
          <div key={index}>
            {message.content}
            <hr />
          </div>
        ))}
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            type="text"
            placeholder="Enter your message"
            value={input}
            onChange={({ target }) => setInput(target.value)}
            required
          />
        </Form.Group>

        <VoiceRecognition onTranscriptChange={setVoiceTranscript} />

        <Button type="submit" className="special-button">
          Ask ChatGPT
        </Button>
      </Form>
    </div>
  );
}
