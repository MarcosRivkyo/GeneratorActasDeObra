"use client";
import type { ActaObra } from "@/types/acta";

export function ActaPreview({ acta }: { acta: ActaObra }) {
  const splitEstado = (s?: string) =>
    (s || "")
      .split(/\n+|;\s*/g)
      .map(t => t.trim())
      .filter(Boolean);
  return (
    <div className="preview">
      <h1>Acta de visita</h1>
      <section>
        <h3>Identificación</h3>
        <p><b>Obra:</b> {acta.obra.nombre || "—"}</p>
        <p><b>Situación:</b> {acta.obra.situacion.callePortal || "—"} · {acta.obra.situacion.ubicacion || "—"} ({acta.obra.situacion.provincia || ""}) {acta.obra.situacion.cp || ""}</p>
        <p><b>Fecha:</b> {new Date(acta.obra.fechaISO).toLocaleString()}</p>
        <p><b>Nº Acta:</b> {acta.obra.numeroActa || "—"}</p>
      </section>
      <section>
        <h3>Asistentes</h3>
        <ul>
          {acta.asistentes.map((a, idx) => (
            <li key={idx}>{a.nombre}{a.cargo ? `, ${a.cargo}` : ""}{a.entidad ? ` (${a.entidad})` : ""}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Estado de la obra</h3>
        <ul className="dash-list">
          {splitEstado(acta.estadoObra).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Cuestiones tratadas</h3>
        <ol>
          {acta.cuestionesTratadas.map((q, i) => (
            <li key={i}><b>{q.titulo || `Punto ${i+1}`}:</b> {q.detalle}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3>Reportaje fotográfico</h3>
        <div className="grid">
          {acta.fotos.map((f, i) => (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.pie || `Foto ${i+1}`} />
              {f.pie && <figcaption>{f.pie}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
      <section>
        <h3>Firmas</h3>
        <ul>
          {acta.firmas.map((f, i) => (
            <li key={i}>{f.nombre}{f.cargo ? `, ${f.cargo}` : ""}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}