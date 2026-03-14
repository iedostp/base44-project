import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

// appBaseUrl is required for base44.auth.loginWithProvider() to redirect
// to https://base44.app instead of a broken relative path on standalone deployments.
export const base44 = createClient({
  appId,
  serverUrl,
  appBaseUrl: serverUrl,   // e.g. "https://base44.app"
  token,
  functionsVersion,
  requiresAuth: false
});
