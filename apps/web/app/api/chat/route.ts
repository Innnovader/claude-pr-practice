import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import { CHAT_TOOLS, executeChatTool } from "@/lib/chat/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  // Requiere sesión — este chat solo es para usuarios autenticados de la DNL.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "El chat con IA no está activado — falta configurar ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  const { messages }: { messages: ChatMessage[] } = await request.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    // Loop de tool-use: Claude puede pedir buscar en la base de datos real
    // antes de dar la respuesta final. Máximo 5 vueltas para evitar loops.
    for (let turn = 0; turn < 5; turn++) {
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1536,
        system: CHAT_SYSTEM_PROMPT,
        tools: CHAT_TOOLS,
        messages: conversation,
      });

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

      if (toolUseBlocks.length === 0) {
        const text = response.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        return NextResponse.json({ reply: text });
      }

      conversation.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await executeChatTool(block.name, block.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
      conversation.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({ reply: "No pude completar la respuesta (demasiadas búsquedas encadenadas)." });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Error al conectar con Claude." }, { status: 500 });
  }
}
