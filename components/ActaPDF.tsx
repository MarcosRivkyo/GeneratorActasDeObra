// components/ActaPDF.tsx
"use client";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";
import type { ActaObra } from "@/types/acta";

/* ===== Estilos ===== */
const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingHorizontal: 36, paddingBottom: 40, fontSize: 11 },

  h1: { 
    fontSize: 10, 
    marginTop: 8, 
    marginBottom: 4, 
    fontWeight: 700,   
    fontStyle: "italic"
  },
  h1Underline: {
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 700,
    fontStyle: "italic",
    textDecoration: "underline", 
  },
  bold: { fontSize: 10, fontWeight: 700 },
  // línea más compacta
  p: { fontStyle: "italic", marginBottom: 1, lineHeight: 0.8 },

  // separadores discontinuos, con menos respiro
  hrDashed: { borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#000", marginVertical: 6, fontWeight:700 },

  // bloque inicial (3 líneas) más pegado
  headBlock: { marginTop: 4, marginBottom: 4 },
  headRow: { flexDirection: "row", justifyContent: "space-between" }, // (sin gap)

  // nº de página
  pageNumber: { position: "absolute", top: 10, right: 36, fontSize: 10 },

  /* ===== Tabla asistentes 4 columnas (2 filas: header + datos) ===== */
  asis4Table: { display: "flex", borderWidth: 1, borderColor: "#000" },
  asis4Row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  asis4Cell: { width: "25%", paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 1, borderColor: "#000" },
  asis4CellLast: { borderRightWidth: 0 },
  asis4Head: { fontStyle: "italic", fontSize: 8, textAlign: "center" },
  asis4Txt: { fontStyle: "italic", fontSize: 8, textAlign: "center" },

  /* Fotos */
  photoTable: { display: "flex", flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000" },
  photoCell: { width: "50%", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#000", padding: 6 },
  photo: { width: "100%", height: 140 },
  photoPlaceholder: { borderWidth: 1, borderColor: "#000" },
  caption: { fontSize: 9, marginTop: 4, textAlign: "center" },

  /* Firmas (2x2) */
  /* Firmas (2x2 sin bordes) */
  firmasBlock: { 
    display: "flex", 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 24 
  },
  firmaBox: { 
    width: "50%", 
    padding: 10, 
    minHeight: 60 
  },
  firmaLabel: { 
    fontStyle: "italic", 
    fontSize: 10, 
    textAlign: "center", 
    marginTop: 20 
  },


  // utilidades
  noRight: { borderRightWidth: 0 },
  noBottom: { borderBottomWidth: 0 },
});



/* ===== Helpers ===== */
const Hr = () => <View style={styles.hrDashed} />;

/** Une estilos evitando null/false y sin exigir misma shape de tipo */
function sx(...parts: any[]): any[] {
  return parts.filter(Boolean) as any[];
}

function formatSituacion(s?: {
  callePortal?: string; ubicacion?: string; provincia?: string; cp?: string;
}) {
  if (!s) return "—";
  const left = [s.callePortal, s.ubicacion].filter(Boolean).join(" · ");
  const right = [s.provincia, s.cp].filter(Boolean).join(" ");
  return [left, right ? `(${right})` : ""].filter(Boolean).join(" ");
}

function renderEstado(estadoObra?: string) {
  if (!estadoObra) return null;
  const items = estadoObra
    .split(/\n+|;\s*/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^\-\s*/, ""));
  return <View>{items.map((it, i) => <Text key={`e-${i}`} style={styles.p}>- {it}</Text>)}</View>;
}

function renderCuestiones(cuestiones: any[] = []) {
  return (
    <View>
      {cuestiones.map((q, i) => (
        <Text key={q.id ?? `q-${i}`} style={styles.p}>
          <Text style={styles.bold}>{`${i + 1}.- ${q.titulo ? `${q.titulo}: ` : ""}`}</Text>
          {q.detalle || ""}
        </Text>
      ))}
    </View>
  );
}

function groupAsistentes(asistentes: Array<{ nombre?: string; cargo?: string; entidad?: string }> = []) {
  const out = { propiedad: [] as string[], constructoras: [] as string[], direccion: [] as string[], css: [] as string[] };
  for (const a of asistentes) {
    const nombre = a?.nombre?.trim();
    if (!nombre) continue;
    const empresa = a?.entidad ? ` (${a.entidad})` : "";
    const full = `${nombre}${empresa}`;

    const cargo = (a?.cargo || "").toLowerCase();
    const entidad = (a?.entidad || "").toLowerCase();
    const txt = `${cargo} ${entidad}`;

    if (/(propiedad|promotor|comunidad)/.test(txt)) out.propiedad.push(full);
    else if (/(dir(ect|)or|dirección|dfa|df|técnic)/.test(txt)) out.direccion.push(full);
    else if (/(coord|seguridad|css)/.test(txt)) out.css.push(full);
    else out.constructoras.push(full);
  }
  return {
    propiedad: out.propiedad.join(", ") || "—",
    constructoras: out.constructoras.join(", ") || "—",
    direccion: out.direccion.join(", ") || "—",
    css: out.css.join(", ") || "—",
  };
}


/* ===== Documento PDF ===== */
function ActaPDFDoc({ acta }: { acta: ActaObra }) {
  const fechaStr = (() => {
    const d = new Date(acta.obra?.fechaISO || "");
    return isNaN(d.getTime()) ? (acta.obra?.fechaISO || "") : d.toLocaleString("es-ES");
  })();

  const grupos = groupAsistentes(acta.asistentes);

  return (
    <Document>
      
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} fixed />

        <Hr />
        <View style={styles.headBlock}>
          <Text style={styles.p}><Text style={styles.bold}>OBRA: </Text>{acta.obra?.nombre || "—"}</Text>
          <Text style={styles.p}><Text style={styles.bold}>Situación: </Text>{formatSituacion(acta.obra?.situacion)}</Text>
          <View style={styles.headRow}>
            <Text style={styles.p}><Text style={styles.bold}>Fecha: </Text>{fechaStr}</Text>
            <Text style={styles.p}><Text style={styles.bold}>Acta Nº: </Text>{acta.obra?.numeroActa || "—"}</Text>
          </View>
        </View>
        <Hr />


        <Text style={styles.h1}>Asistentes:</Text>
        {(() => {
          const g = groupAsistentes(acta.asistentes);
          return (
            <View style={styles.asis4Table}>
              {/* Cabecera */}
              <View style={styles.asis4Row}>
                <View style={styles.asis4Cell}><Text style={styles.asis4Head}>Propiedad</Text></View>
                <View style={styles.asis4Cell}><Text style={styles.asis4Head}>Constructoras</Text></View>
                <View style={styles.asis4Cell}><Text style={styles.asis4Head}>Dirección técnica (DO)</Text></View>
                <View style={[styles.asis4Cell, styles.asis4CellLast]}><Text style={styles.asis4Head}>Coord. de Seguridad (Coord.)</Text></View>
              </View>
              {/* ÚNICA fila de datos */}
              <View style={styles.asis4Row}>
                <View style={styles.asis4Cell}><Text style={styles.asis4Txt}>{g.propiedad}</Text></View>
                <View style={styles.asis4Cell}><Text style={styles.asis4Txt}>{g.constructoras}</Text></View>
                <View style={styles.asis4Cell}><Text style={styles.asis4Txt}>{g.direccion}</Text></View>
                <View style={[styles.asis4Cell, styles.asis4CellLast]}><Text style={styles.asis4Txt}>{g.css}</Text></View>
              </View>
            </View>
          );
        })()}


        <View style={{ marginTop: 8 }}>
          <Text style={styles.h1}>Estado de la obra:</Text>
          {renderEstado(acta.estadoObra)}
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.h1}>Cuestiones tratadas:</Text>
          {renderCuestiones(acta.cuestionesTratadas)}
        </View>


        <View style={{ marginTop: 12 }}>
          <Text style={styles.h1Underline}>Reportaje fotográfico:</Text>
          <View style={styles.photoTable}>
            {(acta.fotos || []).map((f: any, i: number) => {
              const lastRowStart = acta.fotos.length - (acta.fotos.length % 2 || 2);
              const isRightMost = (i % 2) === 1;
              const isLastRow = i >= lastRowStart;

              const cellStyle = sx(
                styles.photoCell,
                isRightMost && styles.noRight,
                isLastRow && styles.noBottom
              );

              return (
                <View key={f.id ?? `f-${i}`} style={cellStyle}>
                  {f.url ? (
                    <Image src={f.url} style={styles.photo} />
                  ) : (
                    <View style={sx(styles.photo, styles.photoPlaceholder)} />
                  )}
                  {f.pie ? <Text style={styles.caption}>{f.pie}</Text> : null}
                </View>
              );
            })}
            {(!acta.fotos || acta.fotos.length === 0) && (
              <>
                <View style={sx(styles.photoCell, styles.noRight)}>
                  <Text style={styles.p}>—</Text>
                </View>
                <View style={sx(styles.photoCell, styles.noBottom)} />
              </>
            )}
          </View>
        </View>

        <View style={styles.firmasBlock}>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>La Empresa Constructora</Text>
          </View>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>Los Directores de Obra</Text>
          </View>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>La Propiedad</Text>
          </View>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>Los Coordinadores de Seguridad</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}

/* ===== Generar → Descargar con usePDF ===== */
export function ActaPDF({ acta }: { acta: ActaObra }) {
  const [generating, setGenerating] = React.useState(false);

const handleDownload = async () => {
  try {
    setGenerating(true);
    const snapshot: ActaObra = JSON.parse(JSON.stringify(acta));

    const instance = pdf(<ActaPDFDoc acta={snapshot} />);
    const blob = await instance.toBlob();

    const cleanedBlob = await removeTrailingBlankPages(blob);

    const url = URL.createObjectURL(cleanedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acta-${snapshot.obra?.numeroActa || Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
  } finally {
    setGenerating(false);
  }
};


  return (
    <button className="btn" onClick={handleDownload} disabled={generating}>
      {generating ? "Generando PDF…" : "⬇️ Descargar PDF"}
    </button>
  );
}

// Elimina páginas "en blanco" al FINAL del PDF
// Heurística: suma el tamaño (bytes) de los streams de contenido de cada página.
// Si la suma es muy pequeña, consideramos la página vacía (suele pasar cuando solo queda el nº de página).
async function removeTrailingBlankPages(blob: Blob): Promise<Blob> {
  const pdfLib = await import("pdf-lib");
  const { PDFDocument, PDFName, PDFArray } = pdfLib;

  const bytes = await blob.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);
  const ctx: any = (pdfDoc as any).context; // cast para evitar errores de tipos internos
  const pages = pdfDoc.getPages();
  if (pages.length <= 1) return blob;

  // Tamaño total en bytes del contenido de una página
  const pageContentSize = (page: any): number => {
    const contents = page.node.get(PDFName.of("Contents"));
    if (!contents) return 0;

    // Devuelve el tamaño de un stream (o referencia) de contenido
    const sizeOf = (refOrStream: any): number => {
      const obj: any = ctx.lookup(refOrStream);
      // pdf-lib guarda el cuerpo del stream en "contents" (Uint8Array); usamos any para no pelear con TS
      const arr = obj?.contents as Uint8Array | undefined;
      return arr ? arr.length : 0;
    };

    if (contents instanceof PDFArray) {
      let total = 0;
      for (let i = 0; i < contents.size(); i++) {
        total += sizeOf(contents.get(i));
      }
      return total;
    }
    return sizeOf(contents);
  };

  // Si solo queda el número de página "fixed", suele rondar < 400–600 bytes.
  // Ajusta si hace falta (sube si no borra; baja si borra de más).
  const THRESHOLD = 600;

  // Busca la última página NO vacía desde el final
  let lastNonBlank = pages.length - 1;
  for (let i = pages.length - 1; i >= 0; i--) {
    const n = pageContentSize(pages[i]);
    if (n > THRESHOLD) { lastNonBlank = i; break; }
  }

  // Si la última ya no es "vacía", no hacemos nada
  if (lastNonBlank === pages.length - 1) return blob;

  // Elimina todas las páginas finales "vacías"
  for (let i = pages.length - 1; i > lastNonBlank; i--) {
    pdfDoc.removePage(i);
  }

  const newBytes = await pdfDoc.save(); // Uint8Array
  return new Blob([new Uint8Array(newBytes)], { type: "application/pdf" });
}
