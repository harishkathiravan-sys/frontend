import { useEffect, useMemo, useRef, useState } from "react";
import AvatarScene from "./components/AvatarScene";

const DEFAULT_MODEL_URL = "/models/avatar.vrm";

const BOT_LINES = [
  "Hey there. Tap me again.",
  "I am your virtual buddy.",
  "Look at me. I can talk.",
  "Nice to see you."
];

export default function App() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const [chatText, setChatText] = useState("");
  const speechStartTimeRef = useRef(0);
  const pointerFrameRef = useRef(0);

  const canSpeak = useMemo(() => "speechSynthesis" in window, []);

  const speakResponse = (text) => {
    if (!canSpeak) {
      return;
    }

    setIsSpeaking(true);
    setCurrentSpeechText(text);
    speechStartTimeRef.current = Date.now();

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const onSpeechEnd = () => {
      setIsSpeaking(false);
      setCurrentSpeechText("");
    };

    utterance.onend = onSpeechEnd;
    utterance.onerror = onSpeechEnd;

    window.speechSynthesis.speak(utterance);
  };

  const onSpeak = () => {
    const randomIndex = Math.floor(Math.random() * BOT_LINES.length);
    speakResponse(BOT_LINES[randomIndex]);
  };

  const onSpeakTypedText = () => {
    const message = chatText.trim();
    if (!message) {
      return;
    }

    speakResponse(message);
    setChatText("");
  };

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  const updateBackgroundPointer = (x, y) => {
    if (pointerFrameRef.current) {
      cancelAnimationFrame(pointerFrameRef.current);
    }

    pointerFrameRef.current = requestAnimationFrame(() => {
      const px = ((x / window.innerWidth) * 100).toFixed(2);
      const py = ((y / window.innerHeight) * 100).toFixed(2);
      document.documentElement.style.setProperty("--pointer-x", px);
      document.documentElement.style.setProperty("--pointer-y", py);
    });
  };

  const onBackgroundPointerMove = (event) => {
    updateBackgroundPointer(event.clientX, event.clientY);
  };

  const onBackgroundPointerLeave = () => {
    document.documentElement.style.setProperty("--pointer-x", "50");
    document.documentElement.style.setProperty("--pointer-y", "50");
  };

  return (
    <main
      className="immersive-shell"
      onPointerMove={onBackgroundPointerMove}
      onPointerLeave={onBackgroundPointerLeave}
    >
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <div className="stage-wrap fade-up">
        <AvatarScene
          modelUrl={DEFAULT_MODEL_URL}
          isSpeaking={isSpeaking}
          speechText={currentSpeechText}
          speechStartTime={speechStartTimeRef.current}
          onInteract={onSpeak}
        />

        <div className="hud-top glass-card">
          <h1>Talking Avatar</h1>
          <p>Tap the character or press Speak.</p>
        </div>

        <div className="hud-bottom glass-card">
          <div className="talk-controls">
            <input
              type="text"
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSpeakTypedText();
                }
              }}
              className="talk-input"
              placeholder="Type your message to the avatar..."
              aria-label="Message for avatar"
            />

            <button
              type="button"
              onClick={chatText.trim() ? onSpeakTypedText : onSpeak}
              className={isSpeaking ? "speaking" : ""}
            >
              {isSpeaking ? "Speaking..." : chatText.trim() ? "Send & Speak" : "Speak"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
