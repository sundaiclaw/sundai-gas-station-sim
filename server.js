import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

app.post('/api/advice', async (req, res) => {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY missing' });
    const { fuelPrice, inventory, queue, weather, cash } = req.body || {};

    const prompt = `You are an operations coach for a gas station simulator game.\nGiven game state, return:\n1) next 3 actions\n2) pricing adjustment\n3) staffing suggestion\n4) risk warning\n\nState:\nFuel price: ${fuelPrice}\nInventory: ${inventory}\nQueue length: ${queue}\nWeather: ${weather}\nCash: ${cash}`;

    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.sundai.club',
        'X-Title': 'Sundai Gas Station Simulator'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const txt = await resp.text();
    if (!resp.ok) return res.status(502).json({ error: `upstream ${resp.status}: ${txt.slice(0,240)}` });
    const data = JSON.parse(txt);
    return res.json({ content: data?.choices?.[0]?.message?.content || '' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 10000, () => console.log('running'));
