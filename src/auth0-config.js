// Auth0 configuration
const auth0Config = {
  domain: "dev-lp7wfteq8g2uknt8.us.auth0.com",
  clientId: "0ualXgjpcqecv6JBUf0uvpD9AgW2IpfA",
  redirectUri: "http://localhost:5173/auth/callback",
  responseType: "token id_token",
  scope: "openid profile email",
  // Make sure issuer matches exactly with the domain
  issuer: "https://dev-lp7wfteq8g2uknt8.us.auth0.com",
};

export default auth0Config;

// Auth0 provider configuration for Firebase
export const auth0ProviderConfig = {
  domain: auth0Config.domain,
  issuer: auth0Config.issuer,
  client_id: auth0Config.clientId,
  redirect_uri: auth0Config.redirectUri,
  response_type: "token id_token",
  scope: "openid profile email",
};
