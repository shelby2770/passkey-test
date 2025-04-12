import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PasskeyAuth } from "../services/PasskeyAuth";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const { currentUser, signInWithGoogle } = useAuth();
  const passkeyAuth = new PasskeyAuth();

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
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google: " + error.message);
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

  async function handlePasskeyRegistration() {
    try {
      setError("");
      setLoading(true);

      // First ensure user is signed in with Google
      if (!currentUser) {
        await signInWithGoogle();
      }

      // Now register passkey with Google profile info
      await passkeyAuth.register(
        currentUser.email,
        currentUser.displayName,
        currentUser.photoURL
      );
    } catch (error) {
      console.error("Passkey registration error:", error);
      setError("Failed to register Passkey: " + error.message);
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
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                </span>
              )}
              Sign in with Google
            </button>

            {passkeySupported && (
              <>
                <button
                  onClick={handlePasskeySignIn}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Sign in with Passkey
                </button>

                <button
                  onClick={handlePasskeyRegistration}
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
    </div>
  );
}
