import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth0Config } from "./auth0-config";

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
const auth0Provider = new OAuthProvider("oidc.default-app");
auth0Provider.setCustomParameters({
  domain: auth0Config.domain,
  client_id: auth0Config.clientId,
  redirect_uri: auth0Config.redirectUri,
  response_type: auth0Config.responseType,
  scope: auth0Config.scope,
  audience: auth0Config.audience,
});

export { auth, googleProvider, auth0Provider, signInWithCustomToken };
