// Auth0 configuration
export const auth0Config = {
  domain: "dev-lp7wfteq8g2uknt8.us.auth0.com",
  clientId: "0ualXgjpcqecv6JBUfOuvpD9AgW2IpfA",
  redirectUri: window.location.origin + "/auth/callback",
  scope: "openid profile email",
  responseType: "code",
  // The audience should be your Auth0 domain
  audience: "https://dev-lp7wfteq8g2uknt8.us.auth0.com",
  // Auth0 tenant region
  region: "us",
};

// Auth0 provider configuration for OIDC
export const auth0ProviderConfig = {
  authority: `https://${auth0Config.domain}`,
  client_id: auth0Config.clientId,
  redirect_uri: auth0Config.redirectUri,
  scope: auth0Config.scope,
  audience: auth0Config.audience,
  response_type: auth0Config.responseType,
};
