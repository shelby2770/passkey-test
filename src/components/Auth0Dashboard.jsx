import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";

const Auth0Dashboard = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-purple-600">
                Auth0 Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <LogoutButton />
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
                className="h-16 w-16 rounded-full"
                src={user?.picture}
                alt={user?.name}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.name}
                </h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900">
                User Information
              </h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email Verified:</span>{" "}
                  {user?.email_verified ? "Yes" : "No"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(user?.updated_at).toLocaleDateString()}
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
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Authentication Method</p>
                <p className="text-lg font-bold text-purple-700">Auth0</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600">Account Status</p>
                <p className="text-lg font-bold text-indigo-700">Active</p>
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
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-purple-600"
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
                    Successfully logged in
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

export default Auth0Dashboard;
