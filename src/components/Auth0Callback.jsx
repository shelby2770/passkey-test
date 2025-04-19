import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithCredential, OAuthProvider } from "firebase/auth";

export default function Auth0Callback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        if (!code) {
          throw new Error("No authorization code found in the URL");
        }

        // Create the credential
        const provider = new OAuthProvider("oidc.default-app");
        const credential = provider.credential({
          idToken: code,
          rawNonce: state,
        });

        // Sign in with the credential
        const result = await signInWithCredential(auth, credential);
        console.log("Auth0 sign-in successful:", result);

        // Store user info
        if (result?.user?.uid) {
          localStorage.setItem("lastRegisteredUserId", result.user.uid);
        }

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("Auth0 callback error:", error);
        setError(error.message);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {error ? "Authentication Error" : "Completing Authentication..."}
          </h2>
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => navigate("/")}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Login
              </button>
            </div>
          )}
          {!error && (
            <div className="mt-4 text-center text-gray-600">
              Please wait while we complete your authentication...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
