import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import auth0Config, { auth0ProviderConfig } from "../auth0-config";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithAuth0, currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when currentUser changes
  useEffect(() => {
    if (currentUser) {
      console.log("User is authenticated, navigating to dashboard");
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth0SignIn() {
    try {
      setError("");
      setLoading(true);
      await signInWithAuth0();
    } catch (error) {
      console.error("Auth0 sign-in detailed error:", {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
        customData: error.customData,
      });
      setError("Failed to sign in with Auth0: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              Sign in with Google
            </button>

            <button
              onClick={handleAuth0SignIn}
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              }`}
            >
              Sign in with Auth0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
