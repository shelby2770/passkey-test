import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAuth0 } from "@auth0/auth0-react";
import Auth0Dashboard from "./Auth0Dashboard";
import GoogleDashboard from "./GoogleDashboard";

const Dashboard = () => {
  const { isAuthenticated: isAuth0Authenticated } = useAuth0();
  const { currentUser: googleUser } = useAuth();

  if (isAuth0Authenticated) {
    return <Auth0Dashboard />;
  } else if (googleUser) {
    return <GoogleDashboard />;
  }

  return null;
};

export default Dashboard;
