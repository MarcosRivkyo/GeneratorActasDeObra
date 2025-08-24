"use client";
import React from "react";

export function AudioRecorder({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [recording, setRecording] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  function startDictado() {
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta dictado local.");
      return;
    }

    const rec = new SR();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.continuous = true; // permite sesiones largas

    rec.onresult = (e: any) => {
      const texto = e.results[e.results.length - 1][0].transcript;
      onTranscribed(texto);
    };

    rec.onerror = (err: any) => {
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
