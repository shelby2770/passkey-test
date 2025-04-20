import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth0 } from "@auth0/auth0-react";
// Protected route component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { user, isAuthenticated } = useAuth0();
  if (!currentUser && !isAuthenticated) {
    console.log("first", user, isAuthenticated);
    return <Navigate to="/" />;
  }
  ``;
  return children;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
