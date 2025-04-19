import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import auth0Config from "./auth0-config";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-51vY-HNblwbQZcEkDgbfvfpnwNSslyo",
  authDomain: "passkey-test70.firebaseapp.com",
  projectId: "passkey-test70",
  storageBucket: "passkey-test70.firebasestorage.app",
  messagingSenderId: "736137648333",
  appId: "1:736137648333:web:b4938f50c9201d5f82b184",
  measurementId: "G-8ZSL3P28LB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure Google provider with necessary scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Configure Auth0 provider
const auth0Provider = new OAuthProvider("auth0.com");
auth0Provider.setCustomParameters({
  // Auth0 domain
  domain: auth0Config.domain,
  // Auth endpoints
  auth_uri: `https://${auth0Config.domain}/authorize`,
  token_uri: `https://${auth0Config.domain}/oauth/token`,
  // Issuer URL must match exactly
  issuer: auth0Config.issuer,
  client_id: auth0Config.clientId,
  // Response type and scope
  response_type: "token id_token",
  scope: "openid profile email",
});

// Add required scopes
auth0Provider.addScope("openid");
auth0Provider.addScope("profile");
auth0Provider.addScope("email");

// Add error handling for Auth0 provider
auth0Provider.credentialFromError = (error) => {
  console.error("Auth0 credential error:", error);
  return null;
};

export { auth, googleProvider, auth0Provider, signInWithCustomToken };
