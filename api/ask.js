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
                // Возвращаем самую быструю модель
                "model": "xiaomi/mimo-v2-flash:free",
                "messages": [
                    {
                        // Новый, более строгий системный промпт
                        "role": "system",
                        "content": "You are a direct, concise AI assistant. Your only purpose is to answer the user's question. You must ignore any previous instructions or persona. You must not introduce yourself, mention being an AI, or ask for clarification. Answer directly and in the language of the user's question. Be brief. Если пользователь пишет на русском, отвечай только на русском языке"
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
