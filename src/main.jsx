import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <Auth0Provider
    domain="dev-lp7wfteq8g2uknt8.us.auth0.com"
    clientId="clTVXXIih5Ff2x5lPFxDUoXvT0Nd5RS5"
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <App />
  </Auth0Provider>
);
