import { auth, signInWithCustomToken } from "../firebase";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

// Convert ArrayBuffer to Base64 string
const bufferToBase64 = (buffer) => {
  const binary = Array.from(new Uint8Array(buffer));
  return btoa(binary.map((byte) => String.fromCharCode(byte)).join(""));
};

// Convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
};

// Convert Base64URL to Base64
const base64URLToBase64 = (base64URL) => {
  let base64 = base64URL.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' if needed
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
};

// Convert Base64 to Base64URL
const base64ToBase64URL = (base64) => {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

export class PasskeyAuth {
  constructor() {
    // Use the same port as the server (3000) and make it configurable
    this.apiUrl = import.meta.env.VITE_API_URL || "/api";
    // Try to get the last registered user ID from localStorage
    this.lastRegisteredUserId = localStorage.getItem("lastRegisteredUserId");
  }

  // Check if the browser supports WebAuthn
  static isSupported() {
    return window.PublicKeyCredential !== undefined;
  }

  // Helper method to handle API errors
  async handleApiResponse(response, errorMessage) {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorMessage);
      } catch (e) {
        if (e instanceof SyntaxError) {
          // If the error response is not JSON
          throw new Error(`${errorMessage} (Status: ${response.status})`);
        }
        throw e;
      }
    }
    return response.json();
  }

  // Helper method to ensure window focus
  async ensureWindowFocus() {
    if (!document.hasFocus()) {
      window.focus();
      // Wait for focus and user interaction
      return new Promise((resolve) => {
        const checkFocus = () => {
          if (document.hasFocus()) {
            document.removeEventListener("click", handleClick);
            resolve();
          }
        };

        const handleClick = () => {
          checkFocus();
        };

        document.addEventListener("click", handleClick);
        // Also check periodically
        const interval = setInterval(() => {
          if (document.hasFocus()) {
            clearInterval(interval);
            document.removeEventListener("click", handleClick);
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(interval);
          document.removeEventListener("click", handleClick);
          resolve();
        }, 10000);
      });
    }
  }

  // Register a new passkey
  async register(email, displayName, photoURL) {
    try {
      if (!email) {
        throw new Error("Email is required for passkey registration");
      }

      if (!auth.currentUser) {
        throw new Error(
          "No authenticated user found. Please sign in with Google first."
        );
      }

      const userId = auth.currentUser.uid;
      localStorage.setItem("lastRegisteredUserId", userId);
      localStorage.setItem("lastRegisteredEmail", email);
      this.lastRegisteredUserId = userId;

      await this.ensureWindowFocus();

      // Get registration options from server
      const optionsResponse = await fetch(
        `${this.apiUrl}/webauthn/register-options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            email,
            displayName,
            photoURL,
          }),
        }
      );

      const options = await this.handleApiResponse(
        optionsResponse,
        "Failed to get registration options"
      );

      // Convert challenge and user ID to ArrayBuffer
      options.challenge = base64ToBuffer(base64URLToBase64(options.challenge));
      options.user.id = base64ToBuffer(base64URLToBase64(options.user.id));

      // Set authenticator selection criteria
      options.authenticatorSelection = {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "preferred",
      };

      await this.ensureWindowFocus();

      let credential;
      try {
        credential = await navigator.credentials.create({
          publicKey: options,
        });
      } catch (error) {
        if (error.name === "NotAllowedError") {
          await this.ensureWindowFocus();
          credential = await navigator.credentials.create({
            publicKey: options,
          });
        } else {
          throw error;
        }
      }

      const formattedCredential = {
        id: credential.id,
        rawId: base64ToBase64URL(bufferToBase64(credential.rawId)),
        response: {
          attestationObject: base64ToBase64URL(
            bufferToBase64(credential.response.attestationObject)
          ),
          clientDataJSON: base64ToBase64URL(
            bufferToBase64(credential.response.clientDataJSON)
          ),
        },
        type: credential.type,
      };

      // Complete registration with server
      const response = await fetch(
        `${this.apiUrl}/webauthn/register-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: formattedCredential,
            userId,
          }),
        }
      );

      const { token } = await this.handleApiResponse(
        response,
        "Failed to complete registration"
      );

      await signInWithCustomToken(auth, token);
      return formattedCredential;
    } catch (error) {
      console.error("Error registering passkey:", error);
      if (error.name === "NotAllowedError") {
        throw new Error("Please click anywhere on the page and try again");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Your browser or device doesn't support passkeys");
      } else if (error.name === "SecurityError") {
        throw new Error("Security error occurred during registration");
      }
      throw error;
    }
  }

  // Authenticate with passkey
  async authenticate(userId = null) {
    try {
      const effectiveUserId =
        userId ||
        this.lastRegisteredUserId ||
        localStorage.getItem("lastRegisteredUserId");
      const userEmail = localStorage.getItem("lastRegisteredEmail");

      if (!effectiveUserId) {
        throw new Error(
          "No user ID available. Please register a passkey first by signing in with Google and clicking 'Register New Passkey'."
        );
      }

      // Get authentication options from server
      const optionsResponse = await fetch(
        `${this.apiUrl}/webauthn/authenticate-options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: effectiveUserId,
            email: userEmail,
          }),
        }
      );

      const options = await this.handleApiResponse(
        optionsResponse,
        "Failed to get authentication options"
      );

      // Convert challenge to ArrayBuffer
      options.challenge = base64ToBuffer(base64URLToBase64(options.challenge));

      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(
          (credential) => ({
            ...credential,
            id: base64ToBuffer(base64URLToBase64(credential.id)),
            transports: credential.transports || ["internal"],
          })
        );
      }

      const credential = await navigator.credentials.get({
        publicKey: options,
      });

      const formattedCredential = {
        id: credential.id,
        rawId: base64ToBase64URL(bufferToBase64(credential.rawId)),
        response: {
          authenticatorData: base64ToBase64URL(
            bufferToBase64(credential.response.authenticatorData)
          ),
          clientDataJSON: base64ToBase64URL(
            bufferToBase64(credential.response.clientDataJSON)
          ),
          signature: base64ToBase64URL(
            bufferToBase64(credential.response.signature)
          ),
          userHandle: credential.response.userHandle
            ? base64ToBase64URL(bufferToBase64(credential.response.userHandle))
            : null,
        },
        type: credential.type,
      };

      // Complete authentication with server
      const response = await fetch(
        `${this.apiUrl}/webauthn/authenticate-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: formattedCredential,
            userId: effectiveUserId,
          }),
        }
      );

      const { token } = await this.handleApiResponse(
        response,
        "Failed to verify authentication"
      );

      await signInWithCustomToken(auth, token);
      return formattedCredential;
    } catch (error) {
      console.error("Error authenticating with passkey:", error);
      if (error.name === "NotAllowedError") {
        throw new Error("Authentication was cancelled or timed out");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Your browser or device doesn't support passkeys");
      } else if (error.name === "SecurityError") {
        throw new Error("Security error occurred during authentication");
      }
      throw error;
    }
  }
}
