require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const base64url = require("base64url");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Create a logging helper
const logFile = path.join(__dirname, "debug.log");
const logger = {
  log: function (...args) {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg
      )
      .join(" ");

    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);

    // Write to file
    fs.appendFileSync(logFile, logMessage);
  },
  error: function (...args) {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        arg instanceof Error
          ? `${arg.message}\n${arg.stack}`
          : typeof arg === "object"
          ? JSON.stringify(arg, null, 2)
          : arg
      )
      .join(" ");

    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    console.error(message);

    // Write to file
    fs.appendFileSync(logFile, logMessage);
  },
};

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

// Initialize Firestore
const db = admin.firestore();

// Store challenges in memory (these are temporary and don't need persistence)
const challenges = new Map();

// Generate a random challenge
function generateChallenge() {
  return crypto.randomBytes(32);
}

// Convert Buffer to Base64URL
function bufferToBase64URL(buffer) {
  return base64url.encode(buffer);
}

// Helper function to format credential for Firestore storage
function formatCredentialForStorage(credential) {
  // Clean function to remove undefined values
  const cleanObject = (obj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === "object" && !ArrayBuffer.isView(value)) {
          cleaned[key] = cleanObject(value);
        } else if (ArrayBuffer.isView(value)) {
          // Convert TypedArray/Buffer to regular array
          cleaned[key] = Array.from(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  // Create a clean version of the credential object
  const cleanCredential = {
    id: credential.id,
    rawId: credential.rawId,
    type: credential.type,
    response: {},
  };

  // Only include response properties that exist
  if (credential.response) {
    if (credential.response.attestationObject) {
      cleanCredential.response.attestationObject =
        credential.response.attestationObject;
    }
    if (credential.response.clientDataJSON) {
      cleanCredential.response.clientDataJSON =
        credential.response.clientDataJSON;
    }
    if (credential.response.authenticatorData) {
      cleanCredential.response.authenticatorData =
        credential.response.authenticatorData;
    }
    if (credential.response.signature) {
      cleanCredential.response.signature = credential.response.signature;
    }
    if (credential.response.userHandle) {
      cleanCredential.response.userHandle = credential.response.userHandle;
    }
  }

  // Clean any remaining undefined values
  return cleanObject(cleanCredential);
}

// Helper function to get user's passkeys from Firestore
async function getUserPasskeys(userId) {
  try {
    console.log("Fetching passkeys for user:", userId);
    const passkeysSnapshot = await db
      .collection("passkeys")
      .where("userId", "==", userId)
      .get();

    console.log("Found passkeys:", passkeysSnapshot.size);
    return passkeysSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching passkeys:", error);
    throw error;
  }
}

// Get registration options
app.get("/api/get-registration-options", (req, res) => {
  try {
    const challenge = generateChallenge();
    const userId = req.query.userId;
    const email = req.query.email;

    logger.log("Getting registration options for user:", userId);

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Store the challenge
    challenges.set(userId, challenge);
    logger.log("Challenge generated and stored for user:", userId);
    logger.log("Challenge base64URL:", bufferToBase64URL(challenge));

    const options = {
      challenge: bufferToBase64URL(challenge),
      rp: {
        name: "Passkey Test App",
        id: process.env.RP_ID || "localhost",
      },
      user: {
        id: bufferToBase64URL(crypto.randomBytes(16)),
        name: email || userId,
        displayName: email || userId,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "preferred",
      },
      timeout: 60000,
    };

    logger.log("Registration options created", options);
    res.json(options);
  } catch (error) {
    logger.error("Error generating registration options:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get authentication options
app.post("/api/auth/passkey/start", async (req, res) => {
  try {
    const challenge = generateChallenge();
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "userId and email are required" });
    }

    // Store the challenge
    challenges.set(userId, challenge);

    // Get stored credentials for this user from Firestore
    const userPasskeys = await getUserPasskeys(userId);

    if (userPasskeys.length === 0) {
      return res.status(404).json({ error: "No passkey found for this user" });
    }

    const allowCredentials = userPasskeys.map((passkey) => ({
      type: "public-key",
      id: passkey.credential.id,
      transports: ["internal"],
    }));

    const options = {
      challenge: bufferToBase64URL(challenge),
      timeout: 60000,
      rpId: process.env.RP_ID || "localhost",
      allowCredentials,
      userVerification: "required",
    };

    res.json(options);
  } catch (error) {
    console.error("Error generating authentication options:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/passkey/complete", async (req, res) => {
  try {
    const { credential, userId, email } = req.body;

    // Find the stored credential in Firestore
    const passkeysSnapshot = await db
      .collection("passkeys")
      .where("userId", "==", userId)
      .where("credential.id", "==", credential.id)
      .get();

    if (passkeysSnapshot.empty) {
      return res.status(404).json({ error: "Credential not found" });
    }

    const storedData = passkeysSnapshot.docs[0].data();

    // Verify challenge
    const storedChallenge = challenges.get(userId);
    if (!storedChallenge) {
      return res
        .status(400)
        .json({ error: "No challenge found for this user" });
    }

    const clientDataJSON = base64url.decode(credential.response.clientDataJSON);
    const clientData = JSON.parse(clientDataJSON);

    if (clientData.challenge !== bufferToBase64URL(storedChallenge)) {
      return res.status(400).json({ error: "Challenge verification failed" });
    }

    // Create a custom token for Firebase Auth
    const customToken = await admin.auth().createCustomToken(userId);

    // Clear the challenge
    challenges.delete(userId);

    res.json({ token: customToken });
  } catch (error) {
    console.error("Error verifying passkey:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the registration endpoint to match client expectations
app.post("/api/register-passkey", async (req, res) => {
  try {
    const { credential, userId, email, displayName, photoURL } = req.body;

    logger.log("Registering passkey for user:", userId);
    logger.log("Received credential:", credential);

    // Verify challenge
    const storedChallenge = challenges.get(userId);
    if (!storedChallenge) {
      logger.log("No challenge found for user:", userId);
      logger.log("Current challenges:", Array.from(challenges.entries()));
      return res
        .status(400)
        .json({ error: "No challenge found for this user" });
    }

    // Verify the credential
    try {
      const clientDataJSON = base64url.decode(
        credential.response.clientDataJSON
      );
      const clientData = JSON.parse(clientDataJSON);

      logger.log("Client data:", clientData);
      logger.log("Stored challenge:", bufferToBase64URL(storedChallenge));

      if (clientData.challenge !== bufferToBase64URL(storedChallenge)) {
        logger.log(
          "Challenge verification failed. Expected:",
          bufferToBase64URL(storedChallenge),
          "Received:",
          clientData.challenge
        );
        return res.status(400).json({ error: "Challenge verification failed" });
      }
    } catch (error) {
      logger.error("Error verifying client data:", error);
      return res
        .status(400)
        .json({ error: "Invalid credential data: " + error.message });
    }

    try {
      // Format credential for storage
      const formattedCredential = formatCredentialForStorage(credential);
      logger.log("Formatted credential:", formattedCredential);

      logger.log("Storing passkey in Firestore...");

      // Store the credential in Firestore with ignoreUndefinedProperties
      const docRef = await db.collection("passkeys").add({
        userId,
        email,
        credential: formattedCredential,
        displayName,
        photoURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.log("Passkey stored with ID:", docRef.id);
    } catch (error) {
      logger.error("Error storing credential in Firestore:", error);
      return res
        .status(500)
        .json({ error: "Failed to store credential: " + error.message });
    }

    // Create or update user in Firebase Auth
    try {
      await admin.auth().getUser(userId);
      await admin.auth().updateUser(userId, {
        email: email,
        displayName: displayName,
        photoURL: photoURL,
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        try {
          await admin.auth().createUser({
            uid: userId,
            email: email,
            displayName: displayName,
            photoURL: photoURL,
          });
        } catch (userCreateError) {
          logger.error("Error creating user:", userCreateError);
          return res.status(500).json({
            error: "Failed to create user: " + userCreateError.message,
          });
        }
      } else {
        logger.error("Error updating user:", error);
        return res
          .status(500)
          .json({ error: "Failed to update user: " + error.message });
      }
    }

    // Create a custom token for Firebase Auth
    try {
      const customToken = await admin.auth().createCustomToken(userId);

      // Clear the challenge
      challenges.delete(userId);

      logger.log("Successfully registered passkey for user:", userId);
      res.json({ token: customToken });
    } catch (tokenError) {
      logger.error("Error creating custom token:", tokenError);
      return res.status(500).json({
        error: "Failed to create authentication token: " + tokenError.message,
      });
    }
  } catch (error) {
    logger.error("Error registering passkey:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
