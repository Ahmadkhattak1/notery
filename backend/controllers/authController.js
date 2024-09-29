// backend/controllers/authController.js
const admin = require('firebase-admin');

// Register a new user
const registerUser = async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: "Email and password are required." });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    res.status(201).send({ uid: userRecord.uid, message: 'User successfully registered' });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).send({ error: error.message });
  }
};

// Log in an existing user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: "Email and password are required." });
  }

  try {
    // Firebase does not directly provide a way to verify a password in admin SDK
    res.status(200).send({ message: 'Login request received, handle on client-side using Firebase SDK' });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).send({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
