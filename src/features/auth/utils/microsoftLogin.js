/**
 * microsoftLogin.js
 *
 * Orchestrates the full Microsoft SSO login flow:
 *   1. Trigger an MSAL popup to acquire the user's Entra ID token.
 *   2. POST the idToken to the backend SSO endpoint.
 *   3. Dispatch the resulting credentials into the Redux store.
 *   4. Navigate the user to the appropriate dashboard.
 *
 * This helper is intentionally framework-agnostic (no hooks) so it can
 * be called from both class and functional components.
 */

import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../../../config/msalConfig";

/**
 * Singleton MSAL instance. Exported so it can be reused across the app
 * (e.g., passed to <MsalProvider> in main.jsx).
 */
export const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Perform Microsoft SSO login end-to-end.
 *
 * @param {Object} params
 * @param {Function} params.loginWithMicrosoft  – RTK Query mutation trigger
 * @param {Function} params.dispatch            – Redux dispatch
 * @param {Function} params.setCredentials      – authSlice action creator
 * @param {Function} params.navigate            – react-router navigate fn
 * @param {Function} params.redirectUserByRole  – role-based redirect helper
 * @param {Function} [params.onError]           – optional error callback (message: string) => void
 */
export async function handleMicrosoftRedirect({
  loginWithMicrosoft,
  dispatch,
  setCredentials,
  navigate,
  redirectUserByRole,
  onError,
  setIsSigningIn,
  onMfaRequired,
}) {
  await msalInstance.initialize();

  try {
    const result = await msalInstance.handleRedirectPromise();
    if (result && result.idToken) {
      if (setIsSigningIn) setIsSigningIn(true);
      const response = await loginWithMicrosoft({ idToken: result.idToken }).unwrap();
      
      if (response?.requiresMfa) {
        if (onMfaRequired) {
          onMfaRequired(response);
          return;
        }
      }

      dispatch(setCredentials(response));
      redirectUserByRole({
        navigate,
        role: response?.user?.role,
        successMessage: "Signed in with Microsoft successfully.",
      });
    }
  } catch (error) {
    console.error("Redirect error", error);
    const serverMessage =
      (error?.data && typeof error.data === "object"
        ? error.data.message
        : error?.data) ?? error?.message;
    onError?.(serverMessage ?? "Sign-in failed after redirect. Please try again.");
  } finally {
    if (setIsSigningIn) setIsSigningIn(false);
  }
}

export async function performMicrosoftLoginRedirect({ onError }) {
  await msalInstance.initialize();

  try {
    await msalInstance.loginRedirect({
      ...loginRequest,
      prompt: "select_account",
    });
  } catch (msalError) {
    if (msalError?.errorCode === "user_cancelled") return;
    const msg = msalError?.message ?? "Microsoft sign-in was interrupted. Please try again.";
    onError?.(msg);
  }
}
