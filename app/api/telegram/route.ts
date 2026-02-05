import { clearSeen } from "@/lib/dedupe";
import { sendTelegramMessage } from "@/lib/telegram";

function getBaseUrl(request: Request) {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const host = request.headers.get("host");
  return host ? `http://${host}` : "";
}

export async function POST(request: Request) {
  const update = await request.json();
  const message = update?.message || update?.callback_query?.message;
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  const text = update?.message?.text || update?.callback_query?.data || "";

  if (!chatId) {
    return new Response("No chat id", { status: 200 });
  }

  if (text === "/start") {
    await sendTelegramMessage("Choose an action:", {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "Run now", callback_data: "/run" },
            { text: "Reset cache", callback_data: "/reset" },
          ],
          [{ text: "Run + Reset", callback_data: "/run_reset" }],
        ],
      },
    });
    return new Response("OK");
  }

  if (text === "/reset") {
    await clearSeen();
    await sendTelegramMessage("Cache cleared.", { chatId });
    return new Response("OK");
  }

  if (text === "/run" || text === "/run_reset") {
    if (text === "/run_reset") {
      await clearSeen();
    }
    const baseUrl = getBaseUrl(request);
    if (!baseUrl) {
      await sendTelegramMessage("Server URL not configured.", { chatId });
      return new Response("OK");
    }
    const encodedChatId = encodeURIComponent(chatId);
    await fetch(`${baseUrl}/api/run?dedupe=0&chatId=${encodedChatId}`, {
      method: "GET",
    });
    await sendTelegramMessage("Run triggered.", { chatId });
    return new Response("OK");
  }

  if (text === "/status") {
    const baseUrl = getBaseUrl(request);
    if (!baseUrl) {
      await sendTelegramMessage("Server URL not configured.", { chatId });
      return new Response("OK");
    }
    const statusRes = await fetch(
      `${baseUrl}/api/run?test=1&debug=1&dedupe=0&chatId=${encodeURIComponent(
        chatId,
      )}`,
      { method: "GET" },
    );
    const statusText = await statusRes.text();
    await sendTelegramMessage(`Status:\n${statusText}`, { chatId });
    return new Response("OK");
  }

  await sendTelegramMessage(
    "Commands: /run, /reset, /run_reset, /status",
    { chatId },
  );
  return new Response("OK");
}
