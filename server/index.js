require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { base64url } = require("base64url");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin with credentials
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "passkey-test70",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CERT_URL,
  }),
});

// Store registered credentials (in a real app, this would be in a database)
const registeredCredentials = new Map();

app.post("/register-passkey", async (req, res) => {
  try {
    const { credential, userId, displayName, photoURL } = req.body;

    // Store the credential with profile info (in production, save to a database)
    registeredCredentials.set(credential.id, {
      userId,
      credential,
      displayName,
      photoURL,
    });

    // Create user in Firebase Auth if not exists
    try {
      await admin.auth().getUser(userId);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        await admin.auth().createUser({
          uid: userId,
          email: userId,
          displayName: displayName,
          photoURL: photoURL,
        });
      }
    }

    // Create a custom token for Firebase Auth
    const customToken = await admin.auth().createCustomToken(userId);

    res.json({ token: customToken });
  } catch (error) {
    console.error("Error registering passkey:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/verify-passkey", async (req, res) => {
  try {
    const { credentialId } = req.body;

    // Find the stored credential (in production, fetch from database)
    const storedData = registeredCredentials.get(credentialId);

    if (!storedData) {
      return res.status(404).json({ error: "Credential not found" });
    }

    // Ensure user exists in Firebase Auth with correct profile info
    try {
      await admin.auth().updateUser(storedData.userId, {
        displayName: storedData.displayName,
        photoURL: storedData.photoURL,
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        await admin.auth().createUser({
          uid: storedData.userId,
          email: storedData.userId,
          displayName: storedData.displayName,
          photoURL: storedData.photoURL,
        });
      }
    }

    // Create a custom token for Firebase Auth
    const customToken = await admin.auth().createCustomToken(storedData.userId);

    res.json({ token: customToken });
  } catch (error) {
    console.error("Error verifying passkey:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
