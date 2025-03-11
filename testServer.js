import express from 'express';
const app = express();
const PORT = 3002;

app.get('/test', (req, res) => res.json({ status: 'OK' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${PORT}`);
}); 