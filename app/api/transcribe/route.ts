import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_TRANSCRIPTION_MODEL } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "Falta el archivo de audio" }, { status: 400 });
    }

    const filename = (audio as File).name || "grabacion.webm";
    const type = (audio as File).type || "audio/webm";
    const file = new File([audio], filename, { type });

    const transcript = await openai.audio.transcriptions.create({
      file,
      model: OPENAI_TRANSCRIPTION_MODEL,
    });

    return NextResponse.json({ text: transcript.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error en transcripción";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
