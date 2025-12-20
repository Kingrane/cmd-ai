// api/ask.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const userQuery = req.query.q;

  if (!userQuery) {
    return res.status(400).send('Please provide a query parameter "q". Example: ?q=your+question');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cmd-ai.vercel.app',
        'X-Title': 'Terminal AI Helper',
      },
      body: JSON.stringify({
        // Меняем модель на более легкую и послушную
        "model": "z-ai/glm-4.5-air:free",
        "messages": [
          {
            // Вот он, наш системный промпт!
            "role": "system",
            "content": "You are a helpful assistant. You must answer the user's question concisely and in the language of the user's question. Do not mention that you are an AI or a language model."
          },
          {
            "role": "user",
            "content": userQuery
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      return res.status(500).send('Error communicating with AI.');
    }

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(aiReply);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
