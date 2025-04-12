import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  // Get the user's photo URL with a fal lback
  const userPhotoURL =
    currentUser?.photoURL ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(currentUser?.displayName || "User");

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={userPhotoURL}
                    alt="Profile"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(currentUser?.displayName || "User");
                    }}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to your Dashboard
              </h2>
              <p className="mt-2 text-gray-600">
                You are now signed in with Google
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
