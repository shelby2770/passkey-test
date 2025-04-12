const express = require("express");
const cors = require("cors");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { isoBase64URL } = require("@simplewebauthn/server/helpers");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();

// Configure CORS with specific options
app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Add security headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());

// Initialize Firebase Admin with environment variables
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });

  // Initialize Firestore
  const db = admin.firestore();

  // Test Firestore connection
  db.collection("test")
    .doc("test")
    .set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log("Firestore connection successful");
      // Clean up test document
      db.collection("test").doc("test").delete();
    })
    .catch((error) => {
      console.error("Firestore connection error:", error);
    });
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// WebAuthn configuration
const rpName = process.env.RP_NAME || "Passkey Demo";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `http://${rpID}:5173`;

// Registration endpoint
app.post("/webauthn/register-options", async (req, res) => {
  try {
    const { userId, email, displayName } = req.body;

    console.log("Received registration request:", {
      userId,
      email,
      displayName,
    });

    if (!userId || !email) {
      throw new Error("Missing required fields: userId and email are required");
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: email,
      userDisplayName: displayName || email,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    console.log("Generated registration options:", {
      rpName,
      rpID,
      origin,
      challenge: options.challenge,
    });

    try {
      // Store challenge in Firestore with error handling
      const challengeRef = admin
        .firestore()
        .collection("challenges")
        .doc(userId);
      await challengeRef.set({
        challenge: options.challenge,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        email: email,
        type: "registration",
      });
      console.log(
        "Successfully stored challenge in Firestore for user:",
        userId
      );
    } catch (firestoreError) {
      console.error("Firestore error while storing challenge:", firestoreError);
      throw new Error("Failed to store challenge: " + firestoreError.message);
    }

    res.json(options);
  } catch (error) {
    console.error("Error in registration options:", error);
    res.status(500).json({
      error: error.message,
      details: {
        rpID,
        origin,
        env: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
            ? "set"
            : "not set",
          RP_ID: process.env.RP_ID ? "set" : "not set",
          ORIGIN: process.env.ORIGIN ? "set" : "not set",
        },
      },
    });
  }
});

// Registration verification endpoint
app.post("/webauthn/register-complete", async (req, res) => {
  try {
    const { credential, userId } = req.body;

    console.log("Received registration completion request for user:", userId);

    if (!credential || !userId) {
      throw new Error(
        "Missing required fields: credential and userId are required"
      );
    }

    // Get stored challenge
    const challengeDoc = await admin
      .firestore()
      .collection("challenges")
      .doc(userId)
      .get();

    if (!challengeDoc.exists) {
      throw new Error("Challenge not found. Please try registering again.");
    }

    const challengeData = challengeDoc.data();
    console.log("Retrieved challenge data:", {
      userId,
      challengeExists: true,
      type: challengeData.type,
      timestamp: challengeData.timestamp,
    });

    const expectedChallenge = challengeData.challenge;

    console.log("Verifying registration response with:", {
      rpID,
      origin,
      challenge: expectedChallenge ? "present" : "missing",
    });

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (verification.verified) {
      console.log("Registration verified successfully for user:", userId);

      // Store the credential in Firestore
      await admin.firestore().collection("passkeys").doc(userId).set({
        credential,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        email: challengeData.email,
      });

      // Create custom token for Firebase Auth
      const token = await admin.auth().createCustomToken(userId);
      res.json({ verified: true, token });
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("Error in registration completion:", error);
    res.status(500).json({
      error: error.message,
      details: {
        rpID,
        origin,
        env: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
            ? "set"
            : "not set",
          RP_ID: process.env.RP_ID ? "set" : "not set",
          ORIGIN: process.env.ORIGIN ? "set" : "not set",
        },
      },
    });
  }
});

// Authentication endpoint
app.post("/webauthn/authenticate-options", async (req, res) => {
  try {
    const { userId } = req.body;

    // Get user's credential from Firestore
    const userDoc = await admin
      .firestore()
      .collection("passkeys")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "No passkey found for this user" });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [
        {
          id: isoBase64URL.toBuffer(userDoc.data().credential.rawId),
          type: "public-key",
          transports: ["internal"],
        },
      ],
      userVerification: "preferred",
    });

    // Store challenge
    await admin.firestore().collection("challenges").doc(userId).set({
      challenge: options.challenge,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json(options);
  } catch (error) {
    console.error("Error generating authentication options:", error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication verification endpoint
app.post("/webauthn/authenticate-complete", async (req, res) => {
  try {
    const { credential, userId } = req.body;

    // Get stored challenge
    const challengeDoc = await admin
      .firestore()
      .collection("challenges")
      .doc(userId)
      .get();
    if (!challengeDoc.exists) {
      throw new Error("Challenge not found");
    }

    const expectedChallenge = challengeDoc.data().challenge;

    // Get stored credential
    const userDoc = await admin
      .firestore()
      .collection("passkeys")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      throw new Error("User credential not found");
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: isoBase64URL.toBuffer(
          userDoc.data().credential.response.attestationObject
        ),
        credentialID: isoBase64URL.toBuffer(userDoc.data().credential.rawId),
        counter: 0,
      },
      requireUserVerification: true,
    });

    if (verification.verified) {
      // Create custom token for Firebase Auth
      const token = await admin.auth().createCustomToken(userId);
      res.json({ verified: true, token });
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("Error verifying authentication:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
