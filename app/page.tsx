// app/page.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ActaForm } from "@/components/ActaForm";
import { ActaPreview } from "@/components/ActaPreview";
import type { ActaObra } from "@/types/acta";
import { LogoutButton } from "@/components/LogoutButton";

type WithId<T = unknown> = T & { id?: string };
const isRecord = (v: unknown): v is Record<string, unknown> =>
typeof v === "object" && v !== null;

const ActaPDF = dynamic(() => import("@/components/ActaPDF").then(m => m.ActaPDF), {
  ssr: false,
  loading: () => <button className="btn" disabled>Generando PDF…</button>,
});

/* ========== Inicialización segura ========== */
function nowLocalYYYYMMDDTHHMM() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function actaVacia(): ActaObra {
  return {
    obra: { fechaISO: nowLocalYYYYMMDDTHHMM(), situacion: {} },
    asistentes: [],
    estadoObra: "",
    cuestionesTratadas: [],
    fotos: [],
    firmas: [],
  };
}

/* ========== Helpers de fecha y shape ========== */
function toISOFromDDMMYYYY(s?: string): string | undefined {
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s; // ya es ISO-like
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  const dd = d.padStart(2, "0");
  const mm = mo.padStart(2, "0");
  return new Date(`${y}-${mm}-${dd}T12:00:00`).toISOString();
}

function ensureDatetimeLocalString(s?: string): string {
  if (!s) return nowLocalYYYYMMDDTHHMM();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return nowLocalYYYYMMDDTHHMM();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function safeUUID() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}_${Math.random()}`; }
}

function coerceActaShape(a: Partial<ActaObra> | ActaObra): ActaObra {
  const base = actaVacia();

  const pa = a as Partial<ActaObra>; 
  const obra = {
    ...base.obra,
    ...pa.obra,
    situacion: {
      ...(base.obra.situacion || {}),
      ...(pa.obra?.situacion || {}),
    },
  };
  obra.fechaISO = ensureDatetimeLocalString(obra.fechaISO);

  return {
    ...base,
    ...a,
    obra,
    asistentes: (a.asistentes ?? base.asistentes).map((x) => ({ id: (x as WithId).id ?? safeUUID(), ...x })),
    cuestionesTratadas: (a.cuestionesTratadas ?? base.cuestionesTratadas).map((x) => ({ id: (x as WithId).id ?? safeUUID(), ...x })),
    firmas: (a.firmas ?? base.firmas).map((x) => ({ id: (x as WithId).id ?? safeUUID(), ...x })),
    fotos: a.fotos ?? base.fotos,
  } as ActaObra;
}


/* ========== Normalización respuesta IA ========== */
type IAJsonLike = {
  identificacion?: { fecha_acta?: string; numero_acta?: string };
  asistentes?: Array<{ nombre?: string; cargo?: string; empresa?: string }>;
  estado_obra?: string;
  cuestiones_tratadas?: Array<{ tema?: string; detalle?: string; responsable?: string; plazo?: string; accion?: string }>;
  firmas?: Array<{ nombre?: string; cargo?: string; empresa?: string }>;
};
type IAActaDirect = Partial<ActaObra> & { obra?: Partial<ActaObra["obra"]> };

function normalizaActaDesdeIA(payload: unknown, previo: ActaObra): Partial<ActaObra> {
  const maybeActa = isRecord(payload) ? (payload as Partial<IAActaDirect>) : undefined;

  // 1) Casi ActaObra
  if (maybeActa?.obra || maybeActa?.asistentes || maybeActa?.estadoObra || maybeActa?.cuestionesTratadas) {
    const p = maybeActa as IAActaDirect;
    const obra = {
      ...previo.obra,
      ...p.obra,
      fechaISO: ensureDatetimeLocalString(
        p.obra?.fechaISO ?? toISOFromDDMMYYYY((p as IAActaDirect & { obra?: { fecha?: string } }).obra?.fecha) ?? previo.obra.fechaISO
      ),
    };
    return {
      ...p,
      obra,
      asistentes: (p.asistentes ?? []).map((a) => ({ id: (a as WithId).id ?? safeUUID(), ...a })),
      cuestionesTratadas: (p.cuestionesTratadas ?? []).map((q) => ({ id: (q as WithId).id ?? safeUUID(), ...q })),
      firmas: (p.firmas ?? []).map((f) => ({ id: (f as WithId).id ?? safeUUID(), ...f })),
    };
  }

  const j = (isRecord(payload) ? (payload as IAJsonLike) : {}) as IAJsonLike;

  const fechaISO = ensureDatetimeLocalString(
    toISOFromDDMMYYYY(j.identificacion?.fecha_acta) ?? previo.obra.fechaISO
  );

  const asistentes = (Array.isArray(j.asistentes) ? j.asistentes : []).map((a) => ({
    id: safeUUID(),
    nombre: a?.nombre ?? "",
    cargo: a?.cargo ?? "",
    entidad: a?.empresa ?? "",
  }));

  const cuestiones = (Array.isArray(j.cuestiones_tratadas) ? j.cuestiones_tratadas : []).map((q) => ({
    id: safeUUID(),
    titulo: q?.tema ?? "",
    detalle: q?.detalle ?? "",
    responsable: q?.responsable ?? "",
    plazo: q?.plazo ?? "",
    accion: q?.accion ?? "",
  }));

  const firmas = (Array.isArray(j.firmas) ? j.firmas : []).map((f) => ({
    id: safeUUID(),
    nombre: f?.nombre ?? "",
    cargo: f?.cargo ?? "",
    entidad: f?.empresa ?? "",
  }));

  return {
    obra: { ...previo.obra, fechaISO, numeroActa: j.identificacion?.numero_acta ?? previo.obra.numeroActa },
    asistentes,
    estadoObra: j.estado_obra ?? previo.estadoObra,
    cuestionesTratadas: cuestiones,
    firmas,
  };
}


function fusionaActa(previo: ActaObra, parcial: Partial<ActaObra>): ActaObra {
  return coerceActaShape({
    ...previo,
    obra: { ...previo.obra, ...(parcial.obra ?? {}) },
    asistentes: parcial.asistentes ?? previo.asistentes,
    estadoObra: parcial.estadoObra ?? previo.estadoObra,
    cuestionesTratadas: parcial.cuestionesTratadas ?? previo.cuestionesTratadas,
    fotos: previo.fotos,
    firmas: parcial.firmas ?? previo.firmas,
  });
}

/* ========== UI: Hero / Sections / Footer ========== */
function Hero() {
  return (
    <header className="hero">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        Generador de Actas de Visita a Obra
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}>
        Dicta desde la obra, deja que la IA estructure el contenido, revisa los campos, añade fotos
        y descarga un PDF profesional en segundos.
      </motion.p>
    </header>
  );
}

function AnimatedSection({ children, delay = 0 }: React.PropsWithChildren<{ delay?: number }>) {
  return (
    <motion.section
      className="card"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      {children}
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Created by Marcos Rivas Kyoguro. © All rights reserved.</p>
      <style jsx>{`
        .footer {
          text-align: center;
          padding: 20px;
          margin-top: 32px;
          border-top: 1px solid var(--border);
          color: var(--muted);
          font-size: 14px;
        }
      `}</style>
    </footer>
  );
}

/* ========== Page ========== */
export default function Page() {
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <ClientApp />
    </Suspense>
  );
}

function ClientApp() {
  const [texto, setTexto] = React.useState("");
  const [plantilla, setPlantilla] = React.useState("");
  const [acta, setActa] = React.useState<ActaObra>(actaVacia());
  const [cargando, setCargando] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function generar() {
    try {
      setCargando(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoLibre: texto, plantilla }),
      });
      const data = await res.json();

      const payload = data?.acta ?? data?.json ?? data;
      if (!payload) return;

      setActa(prev => fusionaActa(prev, normalizaActaDesdeIA(payload, prev)));
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el acta. Revisa la consola para más detalles.");
    } finally {
      setCargando(false);
    }
  }


  function removeFoto(id: string, url?: string) {
    setActa(a => ({ ...a, fotos: a.fotos.filter(f => f.id !== id) }));
    try {
      if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
    } catch {}
  }

  async function onImagesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const withUrls = await Promise.all(
    arr.map(async (f) => ({ id: safeUUID(), url: URL.createObjectURL(f), pie: "" })) // descripción vacía
    );
    setActa(a => ({ ...a, fotos: [...a.fotos, ...withUrls] }));
  }
  function updateFotoPie(id: string, pie: string) {
    setActa(a => ({ ...a, fotos: a.fotos.map(f => f.id === id ? { ...f, pie } : f) }));
  }



  return (
    <main className="container">
      <Hero />
      <LogoutButton/>
      <AnimatedSection delay={0.05}>
        <h2>1) Describe la visita</h2>
        <AudioRecorder onTranscribed={(t) => setTexto((prev) => `${prev}\n${t}`)} />
        <textarea
          rows={6}
          placeholder="O escribe aquí tu descripción de la obra…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <textarea
          rows={4}
          placeholder="(Opcional) Pega aquí tu plantilla para que la IA ajuste el lenguaje/estructura"
          value={plantilla}
          onChange={(e) => setPlantilla(e.target.value)}
        />
        <button className="btn" onClick={generar} disabled={cargando}>
          {cargando ? "Generando con IA…" : "Generar con IA"}
        </button>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <h2>2) Edita los campos</h2>
        <ActaForm value={acta} onChange={(v) => setActa(coerceActaShape(v))} />
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <h2>3) Añade fotos</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onImagesSelected(e.target.files)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginTop: 8 }}>
          {acta.fotos.map((f) => (
            <figure key={f.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 8, background: "var(--card)" }}>
              <img
                src={f.url}
                alt={f.pie?.trim() ? f.pie : ""} // vacío si es decorativa
                style={{ width: "100%", height: "auto", borderRadius: 8 }}
              />
              
              <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 8 }}>
                <input
                  value={f.pie ?? ""}
                  onChange={(e) => updateFotoPie(f.id, e.target.value)}
                  placeholder="Descripción (aparecerá en el PDF)"
                  style={{ flex: 1, fontSize: 12, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <button type="button" className="btn btn-stop" style={{ padding: "6px 10px" }}
                        onClick={() => removeFoto(f.id, f.url)}>
                  Eliminar
                </button>
              </figcaption>
            </figure>
          ))}
        </div>

      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <h2>4) Vista previa</h2>
        <ActaPreview acta={acta} />
        <div style={{ marginTop: 12 }}>
          <ActaPDF acta={acta} />
        </div>
      </AnimatedSection>

      <Footer />

      {/* ========== Estilos globales ========== */}
      <style jsx global>{`
        :root{
          --bg: #f7f8fa;
          --card: #ffffff;
          --text: #0f172a;
          --muted: #6b7280;
          --border: #e5e7eb;
          --ring: #0ea5e9;
          /* NUEVO: colores de controles */
          --control-bg: #ffffff;
          --control-fg: #0f172a;
          --control-ph: #6b7280;
        }

        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body {
          margin: 0;
          color: var(--text);
          background: var(--bg);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu;
          line-height: 1.5;
        }

        .container { max-width: 1040px; margin: 32px auto; padding: 0 16px; }

        /* HERO */
        .hero{
          position: relative;
          text-align: center;
          padding: 56px 16px 28px;
          margin: 0 0 18px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: linear-gradient(120deg,
            rgba(14,165,233,.12),
            rgba(99,102,241,.12),
            rgba(236,72,153,.12));
          background-size: 200% 200%;
          animation: heroGradient 12s ease infinite;
          box-shadow: 0 12px 28px rgba(2,6,23,.06);
        }
        .hero h1{
          margin: 0 0 8px;
          font-size: 34px;
          letter-spacing: .2px;
        }
        .hero p{
          margin: 0;
          color: var(--muted);
          max-width: 860px;
          display: inline-block;
        }
        @keyframes heroGradient{
          0%{ background-position: 0% 50%; }
          50%{ background-position: 100% 50%; }
          100%{ background-position: 0% 50%; }
        }

        .card {
          background: radial-gradient(1600px 300px at 50% -260px, rgba(14,165,233,.08), transparent 60%) , var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px;
          margin: 18px 0;
          box-shadow: 0 10px 26px rgba(2,6,23,.05);
        }
        .card h2 {
          margin: 0 0 14px;
          font-size: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .card h2::before{
          content: ""; width: 8px; height: 8px; border-radius: 999px; background: var(--ring);
          box-shadow: 0 0 0 4px rgba(14,165,233,.15);
        }

        /* Controles */


        textarea, input, select {
          width: 100%;
          padding: 10px 12px;
          background: var(--control-bg);
          color: var(--control-fg);
          border: 1px solid var(--border);
          border-radius: 10px;
          margin: 8px 0;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s, color .15s;
          caret-color: var(--ring);
          color-scheme: light dark;
        }
        textarea:focus, input:focus, select:focus {
          border-color: var(--ring);
          box-shadow: 0 0 0 3px rgba(14,165,233,.2);
        }
        textarea::placeholder, input::placeholder { color: var(--control-ph); }

        /* Botones */
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: #273CF5;
          color: #fff;
          cursor: pointer;
          font-weight: 600;
          transition: transform .06s ease, box-shadow .15s ease, opacity .15s ease, background .15s;
        }
        .btn:hover { box-shadow: 0 6px 18px rgba(14,165,233,.25); }
        .btn:active { transform: translateY(1px); }
        .btn[disabled] { opacity: .6; cursor: default; box-shadow: none; }
        .btn-stop { background: #ef4444; }

        /* Layouts */
        fieldset {
          border: 1px dashed var(--border);
          border-radius: 12px;
          padding: 12px;
          margin: 10px 0;
        }
        legend { padding: 0 8px; color: var(--muted); font-size: 13px; }

        .row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 900px) {
          .row { grid-template-columns: 1fr; }
        }

        /* Vista previa y fotos */
        .preview .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 700px) {
          .preview .grid { grid-template-columns: 1fr; }
        }
        .preview img {
          width: 100%; height: auto;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
        }

        /* Dark mode coherente para el hero */
        @media (prefers-color-scheme: dark) {
          :root{
            --bg:#0b1220; --card:#0f172a; --text:#f8fafc; --muted:#94a3b8; --border:#233044; --ring:#22d3ee;
            /* controles en oscuro */
            --control-bg: var(--card);
            --control-fg: var(--text);
            --control-ph: #94a3b8;          }
          .hero{
            background: linear-gradient(120deg,
              rgba(34,211,238,.12),
              rgba(59,130,246,.12),
              rgba(217,70,239,.12));
            box-shadow: 0 12px 28px rgba(0,0,0,.25);
          }
        }
      `}</style>
    </main>
  );
}
