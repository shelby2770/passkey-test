import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PasskeyAuth } from "../services/PasskeyAuth";
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
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const { signInWithGoogle, signInWithAuth0, currentUser } = useAuth();
  const passkeyAuth = new PasskeyAuth();
  const navigate = useNavigate();

  // Handle navigation when currentUser changes
  useEffect(() => {
    if (currentUser) {
      console.log("User is authenticated, navigating to dashboard");
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const checkPasskeySupport = async () => {
      try {
        const isSupported = PasskeyAuth.isSupported();
        setPasskeySupported(isSupported);
      } catch (error) {
        console.error("Error checking passkey support:", error);
        setPasskeySupported(false);
      }
    };

    checkPasskeySupport();
  }, []);

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      const result = await signInWithGoogle();
      // Store the user ID in localStorage after successful Google sign-in
      if (result?.user?.uid) {
        localStorage.setItem("lastRegisteredUserId", result.user.uid);
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth0SignIn() {
    try {
      console.log("Starting Auth0 sign-in process...");
      setError("");
      setLoading(true);

      console.log("Auth0 configuration:", {
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        redirectUri: auth0Config.redirectUri,
        responseType: auth0Config.responseType,
        scope: auth0Config.scope,
        issuer: auth0Config.issuer,
      });

      console.log("Initializing Auth0 provider...");
      const provider = new OAuthProvider("auth0.com");

      // Set all required custom parameters
      provider.setCustomParameters({
        domain: auth0Config.domain,
        auth_uri: `https://${auth0Config.domain}/authorize`,
        token_uri: `https://${auth0Config.domain}/oauth/token`,
        issuer: auth0Config.issuer,
        client_id: auth0Config.clientId,
        response_type: "token id_token",
        scope: "openid profile email",
      });

      // Add required scopes
      provider.addScope("openid");
      provider.addScope("profile");
      provider.addScope("email");

      try {
        console.log("Attempting Firebase signInWithPopup...");
        const result = await signInWithPopup(auth, provider);

        console.log("Auth0 sign-in successful:", {
          uid: result.user.uid,
          email: result.user.email,
          providerId: result.providerId,
        });

        if (result?.user?.uid) {
          localStorage.setItem("lastRegisteredUserId", result.user.uid);
          console.log("User ID stored in localStorage");
        }
      } catch (signInError) {
        console.error("Firebase signInWithPopup error:", {
          code: signInError.code,
          message: signInError.message,
          credential: signInError.credential,
          email: signInError.email,
          stack: signInError.stack,
        });
        throw signInError;
      }
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

  async function handlePasskeySignIn() {
    try {
      setError("");
      setLoading(true);
      await passkeyAuth.authenticate();
    } catch (error) {
      console.error("Passkey sign in error:", error);
      setError("Failed to sign in with Passkey: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailVerification(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);

      // Ensure the page has focus before proceeding
      if (!document.hasFocus()) {
        // Focus the window
        window.focus();
        // Show a message to the user
        setError("Please ensure this window is focused and try again.");
        return;
      }

      // First, try to sign in with Google using the provided email
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        login_hint: email,
      });

      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        // Store the user information
        localStorage.setItem("lastRegisteredUserId", result.user.uid);
        localStorage.setItem("lastRegisteredEmail", email);

        // Add a small delay to ensure the window regains focus after Google popup
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Ensure window has focus again after Google sign-in
        if (!document.hasFocus()) {
          window.focus();
          setError(
            "Please click anywhere on this page and try registering again."
          );
          return;
        }

        try {
          // Now proceed with passkey registration using the verified Google account
          await passkeyAuth.register(
            email,
            result.user.displayName || "User",
            result.user.photoURL
          );

          setShowModal(false);
          setError(""); // Clear any previous errors
        } catch (regError) {
          console.error("Passkey registration error:", regError);
          if (regError.name === "NotAllowedError") {
            setError(
              "Please ensure this window is focused and try again. If the problem persists, click anywhere on the page first."
            );
          } else if (
            regError.name === "AbortError" ||
            regError.message.includes("cancelled")
          ) {
            setError("Registration was cancelled. Please try again.");
          } else {
            setError("Failed to register passkey: " + regError.message);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled. Please try again.");
      } else if (error.name === "NotAllowedError") {
        setError("Please ensure this window is focused and try again.");
      } else {
        setError(
          "Please make sure you have a Google account with this email and try again."
        );
      }
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
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google
            </button>

            <button
              onClick={handleAuth0SignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Sign in with Auth0
            </button>

            {passkeySupported && (
              <>
                <button
                  onClick={handlePasskeySignIn}
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  }`}
                >
                  Sign in with Passkey
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register New Passkey
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Register New Passkey
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Gmail Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  pattern=".*@gmail\.com$"
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
              >
                {loading ? "Registering..." : "Register Passkey"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
