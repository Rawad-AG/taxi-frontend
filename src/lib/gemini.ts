const GEMINI_API_KEY = 'AQ.Ab8RN6JxcseFdUnLyiv9X7Z1FjyoCfZTcE07DFlAWmdRr1AyMQ';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_PROMPT = [
  'You are the friendly customer-support assistant for DRMTaxi, a ride-hailing app operating in Syrian cities (Damascus, Aleppo, Homs and more).',
  'Help riders and drivers with:',
  '- Booking: pickup/drop-off chosen on the map, car categories (economy, comfort, luxury, van), job types (ride, delivery, send item).',
  '- Fares: base price + per-kilometre rate depending on category; the price is fixed at booking and shown before requesting.',
  '- Payments: cash; "bucket" is a prepaid wallet topped up from the in-app Payments page; pay-later unlocks after 3 completed rides and requires no overdue debts.',
  '- Cancelling: a request can be cancelled while waiting; an accepted ride can be cancelled until the driver arrives.',
  '- Becoming a driver: sign up with personal details, working city/areas and car info, then an admin approves the account.',
  '- Profile features: avatar, editing your name, changing your phone number (verified by SMS code), two-factor login, saved places and routes.',
  'Rules: keep answers short, warm and practical. Always reply in the language the user writes in (Arabic or English).',
  'Never invent prices, promotions or policies beyond the facts above.',
  'For anything you cannot resolve (accidents, complaints about a specific trip, billing disputes) give the human support line +963 944 444 444.',
].join('\n');

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
}

export async function sendSupportMessage(history: ChatTurn[]): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  const data = (await res.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}