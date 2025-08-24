"use client";
import React from "react";

// Tipos mínimos para Web Speech API
type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}


type AudioRecorderProps = { onTranscribed: (text: string) => void };

export function AudioRecorder({ onTranscribed }: AudioRecorderProps) {
  const [recording, setRecording] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  function startDictado() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta dictado local.");
      return;
    }

    const rec = new SR();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.continuous = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const lastIdx = e.results.length - 1;
      const result = e.results[lastIdx];
      const texto = result[0]?.transcript ?? "";
      if (texto) onTranscribed(texto);
    };

    rec.onerror = (err: SpeechRecognitionErrorEvent) => {
      console.error("SpeechRecognition error:", err);
      alert("Error en el dictado del navegador");
      stopDictado();
    };

    rec.onend = () => {
      if (recording) setRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopDictado() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
  }

  return (
    <div className="recorder" style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
      {!recording ? (
        <button onClick={startDictado} className="btn">Empezar dictado</button>
      ) : (
        <button onClick={stopDictado} className="btn btn-stop">Detener dictado</button>
      )}
    </div>
  );
}

