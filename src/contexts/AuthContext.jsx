import { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, auth0Provider } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signInWithGoogle() {
    // Configure Google provider to request profile information
    // Note: Scopes are now configured in firebase.js
    return signInWithPopup(auth, googleProvider)
      .then((result) => {
        console.log("Google sign-in successful:", result.user);
        return result;
      })
      .catch((error) => {
        console.error("Google sign-in error:", error);
        throw error;
      });
  }

  function signInWithAuth0() {
    // Sign in with Auth0 using OpenID Connect
    return signInWithPopup(auth, auth0Provider)
      .then((result) => {
        console.log("Auth0 sign-in successful:", result.user);
        return result;
      })
      .catch((error) => {
        console.error("Auth0 sign-in error:", error);
        throw error;
      });
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    signInWithAuth0,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
