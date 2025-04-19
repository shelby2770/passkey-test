import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithCredential, OAuthProvider } from "firebase/auth";
import auth0Config from "../auth0-config";

export default function Auth0Callback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Starting Auth0 callback handling...");
        console.log("Current URL:", window.location.href);

        // Get the tokens from the URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get("id_token");
        const accessToken = params.get("access_token");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        console.log("URL Parameters:", {
          hash: hash,
          idToken: idToken ? "present" : "missing",
          accessToken: accessToken ? "present" : "missing",
          error: error,
          errorDescription: errorDescription,
        });

        if (error) {
          throw new Error(`Auth0 error: ${error} - ${errorDescription}`);
        }

        if (!idToken) {
          throw new Error("No ID token found in the URL");
        }

        // Create the credential with the ID token
        console.log("Creating Firebase credential...");
        const provider = new OAuthProvider("auth0.com");

        // Log the credential parameters
        console.log("Credential parameters:", {
          provider: provider.providerId,
          idToken: idToken ? "present" : "missing",
          accessToken: accessToken ? "present" : "missing",
        });

        const credential = provider.credential({
          idToken,
          accessToken,
        });

        // Sign in with the credential
        console.log("Attempting Firebase sign in...");
        try {
          const result = await signInWithCredential(auth, credential);
          console.log("Firebase sign-in successful:", {
            uid: result.user.uid,
            email: result.user.email,
            isAnonymous: result.user.isAnonymous,
          });

          // Store user info
          if (result?.user?.uid) {
            localStorage.setItem("lastRegisteredUserId", result.user.uid);
            console.log("User info stored in localStorage");
          }

          // Redirect to dashboard
          navigate("/dashboard");
        } catch (firebaseError) {
          console.error("Firebase sign-in error:", {
            code: firebaseError.code,
            message: firebaseError.message,
            stack: firebaseError.stack,
            credential: credential ? "present" : "missing",
          });
          throw firebaseError;
        }
      } catch (error) {
        console.error("Auth0 callback detailed error:", {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
          location: window.location.href,
        });
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
