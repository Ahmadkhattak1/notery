// backend/src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { db } = require('../config/firebaseConfig'); // Import Firestore
const app = require('./server'); // Import the configured app from server.js

dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Test Route to Verify Firebase Firestore Connection
app.get('/testFirestore', async (req, res) => {
  try {
    const testCollection = db.collection('test');
    const snapshot = await testCollection.get();
    let data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).send({ success: true, data });
  } catch (error) {
    console.error("Error connecting to Firestore:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  