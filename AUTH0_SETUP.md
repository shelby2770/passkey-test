# Setting Up Auth0 with Firebase

This guide will help you set up Auth0 as an identity provider for your Firebase application.

## Prerequisites

- An Auth0 account (sign up at [auth0.com](https://auth0.com) if you don't have one)
- A Firebase project (already set up in this application)

## Step 1: Create an Auth0 Application

1. Log in to your Auth0 dashboard
2. Go to "Applications" > "Create Application"
3. Name your application (e.g., "Passkey Test")
4. Select "Single Page Application"
5. Click "Create"

## Step 2: Configure Auth0 Application

1. In your Auth0 application settings, configure the following:

   - **Allowed Callback URLs**: `https://passkey-test70.firebaseapp.com/__/auth/handler`
   - **Allowed Logout URLs**: `https://passkey-test70.firebaseapp.com`
   - **Allowed Web Origins**: `https://passkey-test70.firebaseapp.com`

2. Save the changes

## Step 3: Get Your Auth0 Credentials

1. In your Auth0 application settings, note down:

   - **Domain**: `dev-lp7wfteq8g2uknt8.us.auth0.com`
   - **Client ID**: `0ualXgjpcqecv6JBUfOuvpD9AgW2IpfA`
   - **Client Secret**: `E7IFQFL59LWdCOjM75_D1UYDgmjCzhxRlSCOylDUFg8_7T11TUge7T5HJ6bS1GT5`

2. Update the `auth0-config.js` file with your Client ID and Client Secret:
   ```javascript
   export const auth0Config = {
     domain: "dev-lp7wfteq8g2uknt8.us.auth0.com",
     clientId: "0ualXgjpcqecv6JBUfOuvpD9AgW2IpfA",
     clientSecret:
       "E7IFQFL59LWdCOjM75_D1UYDgmjCzhxRlSCOylDUFg8_7T11TUge7T5HJ6bS1GT5",
     redirectUri: "https://passkey-test70.firebaseapp.com/__/auth/handler",
     audience: "https://passkey-test70.firebaseapp.com",
     scope: "openid profile email",
   };
   ```

## Step 4: Configure Firebase Authentication

1. In your Firebase console, go to Authentication > Sign-in method
2. Enable "OpenID Connect" as a sign-in provider
3. Configure the provider with:
   - **Provider ID**: `oidc.auth0`
   - **Client ID**: `0ualXgjpcqecv6JBUfOuvpD9AgW2IpfA`
   - **Client Secret**: `E7IFQFL59LWdCOjM75_D1UYDgmjCzhxRlSCOylDUFg8_7T11TUge7T5HJ6bS1GT5`
   - **Issuer URL**: `https://dev-lp7wfteq8g2uknt8.us.auth0.com/`

## Step 5: Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install react-router-dom
```

## Step 6: Test the Integration

1. Start your application with `npm run dev`
2. Click on "Sign in with Auth0" button
3. You should be redirected to the Auth0 login page
4. After successful login, you should be redirected back to your application

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that your Auth0 application settings match the ones in this guide
3. Ensure that your Firebase configuration is correct
4. Check that the redirect URI in your Auth0 application matches the one in your code

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [OpenID Connect Documentation](https://openid.net/connect/)
