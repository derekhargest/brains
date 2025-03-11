const express = require('express');
const app = express();
const PORT = 3002;

app.get('/test', (req, res) => res.json({ success: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
}); 