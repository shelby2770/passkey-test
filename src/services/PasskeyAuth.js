import { auth, signInWithCustomToken } from "../firebase";

// Convert ArrayBuffer to Base64 string
const bufferToBase64 = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

// Convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
};

export class PasskeyAuth {
  constructor() {
    this.challenge = null;
    this.apiUrl = "/api"; // Updated to use the proxy
  }

  // Check if the browser supports WebAuthn
  static isSupported() {
    return window.PublicKeyCredential !== undefined;
  }

  // Generate a random challenge
  generateChallenge() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    this.challenge = array;
    return array;
  }

  // Register a new passkey
  async register(username, displayName, photoURL) {
    try {
      // Generate registration options
      const publicKeyCredentialCreationOptions = {
        challenge: this.generateChallenge(),
        rp: {
          name: "Passkey Test App",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: username,
          displayName: displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: true,
          userVerification: "required",
        },
        timeout: 60000,
      };

      // Create credentials
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      // Format the response
      const formattedCredential = {
        id: credential.id,
        rawId: bufferToBase64(credential.rawId),
        response: {
          attestationObject: bufferToBase64(
            credential.response.attestationObject
          ),
          clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        },
        type: credential.type,
      };

      // Register with backend and get Firebase token
      const response = await fetch(`${this.apiUrl}/register-passkey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: formattedCredential,
          userId: username,
          displayName: displayName,
          photoURL: photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register passkey with server");
      }

      const { token } = await response.json();

      // Sign in to Firebase with the custom token
      await signInWithCustomToken(auth, token);

      return formattedCredential;
    } catch (error) {
      console.error("Error registering passkey:", error);
      throw error;
    }
  }

  // Authenticate with passkey
  async authenticate() {
    try {
      const publicKeyCredentialRequestOptions = {
        challenge: this.generateChallenge(),
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      };

      // Get credentials
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      // Format the response
      const formattedCredential = {
        id: credential.id,
        rawId: bufferToBase64(credential.rawId),
        response: {
          authenticatorData: bufferToBase64(
            credential.response.authenticatorData
          ),
          clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
          signature: bufferToBase64(credential.response.signature),
          userHandle: credential.response.userHandle
            ? bufferToBase64(credential.response.userHandle)
            : null,
        },
        type: credential.type,
      };

      // Verify with backend and get Firebase token
      const response = await fetch(`${this.apiUrl}/verify-passkey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credentialId: credential.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify passkey with server");
      }

      const { token } = await response.json();

      // Sign in to Firebase with the custom token
      await signInWithCustomToken(auth, token);

      return formattedCredential;
    } catch (error) {
      console.error("Error authenticating with passkey:", error);
      throw error;
    }
  }
}
