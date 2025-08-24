// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { actaJsonSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { textoLibre, plantilla } = await req.json();
    if (!textoLibre) {
      return NextResponse.json({ error: "Falta texto de entrada" }, { status: 400 });
    }

    const system = `Eres un asistente que extrae información para completar un acta de visita a obra.
    Devuelve SIEMPRE JSON válido según el esquema.
    Asume hoy como fecha por defecto si no se menciona.
    Respeta nombres propios y datos tal cual se dicten.
    Si un campo no existe, devuelve cadena vacía o arrays vacíos según corresponda.`;

    const user = `Texto dictado por el usuario (español):\n\n${textoLibre}\n\nSi hay una plantilla, ajústalo a su terminología:\n${plantilla || "(sin plantilla)"}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: actaJsonSchema as any },
      temperature: 0,
    });

    const jsonText = completion.choices[0]?.message?.content ?? "{}";
    const acta = JSON.parse(jsonText);

    return NextResponse.json({ acta });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "Error al generar acta" }, { status: 500 });
  }
}
