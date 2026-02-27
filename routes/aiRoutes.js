const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ message: 'OpenAI API key is not configured on the server.' });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful fashion shopping assistant for an online clothing store. Help users choose products, sizes, and styles.',
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I'm not sure how to answer that right now.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error in AI chat route:', error);
    return res
      .status(500)
      .json({ message: 'Failed to get response from AI assistant.' });
  }
});

module.exports = router;

