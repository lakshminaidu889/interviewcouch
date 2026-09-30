import { useEffect, useRef, useState } from "react";

// Browser speech-to-text (Chrome/Edge/Safari). `onFinal` gets each finished phrase.
export function useSpeech(onFinal) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recRef = useRef(null);
  const callback = useRef(onFinal);
  callback.current = onFinal;

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const start = () => {
    if (!SR || listening) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) callback.current(result[0].transcript.trim());
        else live += result[0].transcript;
      }
      setInterim(live);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => recRef.current?.stop();

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: Boolean(SR), listening, interim, start, stop };
}
