import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);

export { auth, analytics };
export default app;
