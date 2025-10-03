const express = require('express');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const rateLimit = require('express-rate-limit');

const app = express();


async function generatePetpet(imageUrl, options = {}) {
  const FRAMES = 10;
  const RESOLUTION = options.resolution || 128;
  const DELAY = options.delay || 20;

  const avatar = await loadImage(imageUrl);

  const frameUrls = Array.from(
    { length: FRAMES },
    (_, i) => `https://raw.githubusercontent.com/relentiousdragon/pet-pet-api/refs/heads/main/frames/pet${i}.gif`
  );
  const frames = await Promise.all(frameUrls.map(loadImage));

  const encoder = new GIFEncoder(RESOLUTION, RESOLUTION, 'octree', true);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(DELAY);
  encoder.setTransparent();

  const canvas = createCanvas(RESOLUTION, RESOLUTION);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < FRAMES; i++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const j = i < FRAMES / 2 ? i : FRAMES - i;
    const width = 0.8 + j * 0.02;
    const height = 0.8 - j * 0.05;
    const offsetX = (1 - width) * 0.5 + 0.1;
    const offsetY = 1 - height - 0.08;

    ctx.drawImage(
      avatar,
      offsetX * RESOLUTION,
      offsetY * RESOLUTION,
      width * RESOLUTION,
      height * RESOLUTION
    );
    ctx.drawImage(frames[i], 0, 0, RESOLUTION, RESOLUTION);

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

const petpetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { error: "Too many requests. Please slow down." }
});

app.get('/petpet', petpetLimiter, async (req, res) => {
  try {
    const imageUrl = req.query.image;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing ?image=URL parameter' });
    }

    const buffer = await generatePetpet(imageUrl);

    res.set('Content-Type', 'image/gif');
    res.send(buffer);
  } catch (err) {
    console.error('❌ Petpet error:', err);
    res.status(500).json({ error: 'Failed to generate petpet gif' });
  }
});

const PORT = 20000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
