import { useMemo, useRef, useState } from "react";
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
  const speechStartTimeRef = useRef(0);

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

  return (
    <main className="immersive-shell">
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
          <button type="button" onClick={onSpeak} className={isSpeaking ? "speaking" : ""}>
            {isSpeaking ? "Speaking..." : "Speak"}
          </button>
        </div>
      </div>
    </main>
  );
}
