require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.DOC_SERVICE_PORT || 3002;

// Middleware
app.use(express.json());
// Potentially serve static files if documents are stored locally and accessed directly (secure appropriately)
// app.use('/uploads', express.static('uploads')); // Example

// Basic Route
app.get('/', (req, res) => {
  res.send('Document Service is running!');
});

// API Routes
const docRoutes = require('./routes/docRoutes');
app.use('/documents', docRoutes);

app.listen(port, () => {
  console.log(`Document Service listening on port ${port}`);
});
