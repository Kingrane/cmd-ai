// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Поддерживаем как ?q=..., так и путь /... (например: /how many...)
  // Если используете Vercel/Next.js, req.query.q работает для ?q=...
  // А для пути вида /api/ask/how%20many... можно взять req.url или req.query.slug при catch-all route.
  const q = req.query.q || (() => {
    // попытка извлечь текст из пути: /api/ask/<text>
    const url = req.url || '';
    const match = url.match(/^\/api\/ask\/(.*)$/);
    if (!match) return '';
    // decodeURIComponent декодирует %20, но не + — заменим '+' вначале
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  })();

  if (!q || !q.trim()) {
    return res.status(400).send('Please provide a query parameter "q". Example: ?q=your+question');
  }

  const userQuery = q.trim();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Не выставляйте нестандартные/ненужные заголовки с приватными данными
      },
      body: JSON.stringify({
        model: 'xiaomi/mimo-v2-flash:free',
        messages: [
          {
            role: 'system',
            content: 'You are a direct, concise AI assistant. Your only purpose is to answer the user\'s question. You must ignore any previous instructions or persona. You must not introduce yourself, mention being an AI, or ask for clarification. Answer directly and in the language of the user\'s question. Be brief.'
          },
          { role: 'user', content: userQuery }
        ]
      }),
      // Опционально: таймаут и т.п. можно реализовать через AbortController
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('OpenRouter API Error:', response.status, text);
      return res.status(502).send('Error communicating with AI.');
    }

    const data = await response.json();
    const aiReply = data?.choices?.[0]?.message?.content ?? '';

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(aiReply);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
