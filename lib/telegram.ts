type TelegramSendOptions = {
  parseMode?: "MarkdownV2" | "HTML";
  disableWebPreview?: boolean;
  chatId?: string;
  replyMarkup?: Record<string, unknown>;
};

export async function sendTelegramMessage(
  text: string,
  options: TelegramSendOptions = {},
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error(
      "Telegram bot token or chat ID is not set in environment variables.",
    );
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options.parseMode,
      disable_web_page_preview: options.disableWebPreview,
      reply_markup: options.replyMarkup,
    }),
  });
}
