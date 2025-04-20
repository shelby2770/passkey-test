import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAuth0 } from "@auth0/auth0-react";
import Auth0Dashboard from "./Auth0Dashboard";

const GoogleDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = React.useState("");
  const [userName, setUserName] = React.useState("");

  React.useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email || "User");
      if (currentUser.photoURL) {
        setProfileImageUrl(currentUser.photoURL);
      }
    }
  }, [currentUser]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName || "User"
    )}&background=random`;
    setProfileImageUrl(fallbackUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">
                Google Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={profileImageUrl}
                  alt={`${userName}'s profile`}
                  onError={handleImageError}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {userName}
                </span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <img
                className="h-16 w-16 rounded-full object-cover"
                src={profileImageUrl}
                alt={userName}
                onError={handleImageError}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
                <p className="text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900">
                User Information
              </h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email Verified:</span>{" "}
                  {currentUser?.emailVerified ? "Yes" : "No"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last Sign In:</span>{" "}
                  {currentUser?.metadata?.lastSignInTime
                    ? new Date(
                        currentUser.metadata.lastSignInTime
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Authentication Method</p>
                <p className="text-lg font-bold text-blue-700">Google</p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4">
                <p className="text-sm text-cyan-600">Account Status</p>
                <p className="text-lg font-bold text-cyan-700">Active</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Successfully logged in with Google
                  </p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const { isAuthenticated: isAuth0Authenticated } = useAuth0();
  const { currentUser: googleUser } = useAuth();

  if (isAuth0Authenticated) {
    return <Auth0Dashboard />;
  }

  if (googleUser) {
    return <GoogleDashboard />;
  }

  return null;
};

export default Dashboard;
