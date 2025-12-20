// api/ask.js

// Эта функция будет запускаться Vercel, когда кто-то обращается к /api/ask
export default async function handler(req, res) {
    // 1. Проверяем, что запрос методом GET
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    // 2. Получаем вопрос из URL. Он находится в параметре "q".
    // Например, в "http://.../api/ask?q=привет", query.q будет "привет"
    const userQuery = req.query.q;

    if (!userQuery) {
        // Если вопрос не задан, возвращаем ошибку
        return res.status(400).send('Please provide a query parameter "q". Example: ?q=your+question');
    }

    try {
        // 3. Готовим запрос к OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // <-- Наш секретный ключ!
                'Content-Type': 'application/json',
                // OpenRouter требует указать HTTP-Referer и X-Title
                'HTTP-Referer': 'https://cmd-ai.vercel.app', // Замени на свой домен после деплоя
                'X-Title': 'Terminal AI Helper',
            },
            body: JSON.stringify({
                // Модель. Мы используем бесплатную и мощную Llama 3
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": [
                    {
                        "role": "user",
                        "content": userQuery
                    }
                ]
            })
        });

        if (!response.ok) {
            // Если OpenRouter вернул ошибку
            const errorData = await response.json();
            console.error('OpenRouter API Error:', errorData);
            return res.status(500).send('Error communicating with AI.');
        }

        // 4. Получаем ответ от OpenRouter
        const data = await response.json();

        // Извлекаем текст ответа
        const aiReply = data.choices[0].message.content;

        // 5. Отправляем ответ обратно в curl в виде простого текста
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(aiReply);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).send('Internal Server Error');
    }
}
