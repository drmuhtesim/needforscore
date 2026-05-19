/**
 * Native (Capacitor) OAuth helpers.
 *
 * On iOS/Android the Lovable OAuth broker (`/~oauth/initiate`) is unavailable,
 * and Supabase's default redirect to a web URL would bounce the user out of the
 * app and into Safari. Instead we:
 *
 *  1. Use a custom URL scheme (`needforscore://auth/callback`) registered with
 *     the OS via the iOS Info.plist `CFBundleURLTypes` / Android intent filter.
 *  2. Ask Supabase for the OAuth URL with `skipBrowserRedirect: true`.
 *  3. Open that URL in an in-app browser tab via `@capacitor/browser`.
 *  4. Listen for `appUrlOpen` — when the provider redirects back to our scheme
 *     we close the browser and call `exchangeCodeForSession` so the user is
 *     signed in inside the WebView.
 *
 * Setup (one-time, performed in the native project after `npx cap add`):
 *  - iOS: in `ios/App/App/Info.plist` add a `CFBundleURLTypes` entry with
 *    `CFBundleURLSchemes = ["needforscore"]`.
 *  - Android: in `android/app/src/main/AndroidManifest.xml` add an
 *    `<intent-filter>` on the main activity with
 *    `<data android:scheme="needforscore" android:host="auth" />`.
 *  - Supabase Dashboard → Authentication → URL Configuration: add
 *    `needforscore://auth/callback` to the redirect allow-list.
 */

import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

export const NATIVE_REDIRECT_URL = "needforscore://auth/callback";
export const UNIVERSAL_LINK_CALLBACK = "https://needforscore.com/auth/callback";

const isOAuthCallbackUrl = (url: string): boolean =>
  url.startsWith(NATIVE_REDIRECT_URL) || url.startsWith(UNIVERSAL_LINK_CALLBACK);

export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Open the provider OAuth flow in an in-app browser and return when the
 * deep-link callback fires (or the user dismisses the sheet).
 */
export const signInWithOAuthNative = async (
  provider: "google" | "apple",
): Promise<{ error?: Error }> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) {
    return { error: error ?? new Error("Failed to start OAuth flow") };
  }
  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return {};
};

let deepLinkListenerRegistered = false;

/**
 * Register a global deep-link listener so any return from the OAuth provider
 * exchanges the PKCE code for a session and closes the in-app browser.
 * Safe to call multiple times — only the first call registers the listener.
 */
export const registerOAuthDeepLinkHandler = (
  onSession?: () => void,
): void => {
  if (!isNativePlatform() || deepLinkListenerRegistered) return;
  deepLinkListenerRegistered = true;

  App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    const url = event.url;
    if (!url || !isOAuthCallbackUrl(url)) return;
    try {
      // PKCE flow: ?code=...&state=...
      // Implicit flow fallback: #access_token=...&refresh_token=...
      const hasCode = /[?&]code=/.test(url);
      const hasHashTokens = /#.*access_token=/.test(url);

      if (hasCode) {
        await supabase.auth.exchangeCodeForSession(url);
      } else if (hasHashTokens) {
        const hash = url.split("#")[1] ?? "";
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      onSession?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[oauth] deep link handling failed", err);
    } finally {
      try {
        await Browser.close();
      } catch {
        /* no-op */
      }
    }
  });
};
