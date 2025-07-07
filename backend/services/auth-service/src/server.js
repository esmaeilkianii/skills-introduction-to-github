require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.AUTH_SERVICE_PORT || 3001;

// Middleware
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Auth Service is running!');
});

// API Routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Auth Service listening on port ${port}`);
});
