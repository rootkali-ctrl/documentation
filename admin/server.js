// admin/server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve React’s build output
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback: send index.html on all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Admin server running on port ${PORT}`);
});
