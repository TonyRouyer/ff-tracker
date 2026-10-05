// Lancement local : API + front sur le même port (http://localhost:3001).
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api, { preloadCollections } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const server = express();
server.use(api);

if (process.argv.includes('--dev')) {
  // En dev, Vite tourne dans le même serveur (pas de proxy : celui de Vite bloquait sur les grosses réponses).
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  server.use(vite.middlewares);
} else {
  // En production locale, le serveur sert le front compilé.
  const dist = path.join(root, 'dist');
  server.use(express.static(dist));
  server.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

server.listen(PORT, () => {
  console.log(`FF Tracker sur http://localhost:${PORT}`);
  preloadCollections().then(() => console.log('Collections FFXIV Collect préchargées'));
});
