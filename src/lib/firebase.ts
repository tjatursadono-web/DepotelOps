/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfigFromJson from '../../firebase-applet-config.json';

// Support VITE_ environment variables or fall back to the pre-configured JSON file.
// This allows users to easily override configuration when deploying to platforms like GitHub Pages.
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigFromJson.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFromJson.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigFromJson.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFromJson.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFromJson.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigFromJson.appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
// Add Google Sheets and Google Drive file scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have a cached token in memory, use it immediately
  let storedToken = null;
  try {
    storedToken = localStorage.getItem('g_access_token');
  } catch (e) {
    // ignore
  }
  if (storedToken) {
    cachedAccessToken = storedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we don't have the cached access token in memory or localStorage,
        // we check if there's any stored token
        let backupToken = null;
        try {
          backupToken = localStorage.getItem('g_access_token');
        } catch (e) {
          // ignore
        }
        if (backupToken) {
          cachedAccessToken = backupToken;
          if (onAuthSuccess) onAuthSuccess(user, backupToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          try {
            localStorage.removeItem('g_access_token');
          } catch (e) {
            // ignore
          }
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      // If there's no auth user, but we have a stored token, we can still use it!
      // This is helpful if we want to bypass Google login completely for daily use.
      let backupToken = null;
      try {
        backupToken = localStorage.getItem('g_access_token');
      } catch (e) {
        // ignore
      }
      if (backupToken) {
        cachedAccessToken = backupToken;
        // Mock a user object or retrieve from localStorage
        let storedUserJson = null;
        try {
          storedUserJson = localStorage.getItem('g_google_user');
        } catch (e) {
          // ignore
        }
        let parsedUser: User | null = null;
        if (storedUserJson) {
          try {
            parsedUser = JSON.parse(storedUserJson) as User;
          } catch (e) {
            // ignore
          }
        }
        if (parsedUser && onAuthSuccess) {
          onAuthSuccess(parsedUser, backupToken);
          return;
        }
      }

      if (!isSigningIn) {
        cachedAccessToken = null;
        try {
          localStorage.removeItem('g_access_token');
        } catch (e) {
          // ignore
        }
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('g_access_token', cachedAccessToken);
    } catch (e) {
      // ignore
    }
    
    // Serialize some of the user profile so we can restore it offline / on bypass
    const minimalUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };
    try {
      localStorage.setItem('g_google_user', JSON.stringify(minimalUser));
    } catch (e) {
      // ignore
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return localStorage.getItem('g_access_token');
  } catch (e) {
    return null;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    localStorage.removeItem('g_access_token');
    localStorage.removeItem('g_google_user');
  } catch (e) {
    // ignore
  }
};
