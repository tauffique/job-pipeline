import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PARSE_SYSTEM } from "@/lib/prompts";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { jd } = await req.json();

    if (!jd?.trim()) {
      return NextResponse.json({ error: "No JD provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001", // fast + cheap for parsing
      max_tokens: 256,
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content: `Parse this job description:\n\n${jd}` }],
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("/api/parse error:", err);
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}