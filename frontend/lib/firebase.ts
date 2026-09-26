import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

// Browser-side Firebase config (Project settings → Your apps → Web app).
// This is NOT the backend's service-account key.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Without a web config the app runs in demo mode: sign-in mints a `test-…`
 * token, which the backend's auth dependency accepts in development.
 */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);
export const storageEnabled = firebaseEnabled && Boolean(config.storageBucket);

let app: FirebaseApp | null = null;

function firebaseApp(): FirebaseApp {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured.");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config);
  }
  return app;
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

/** Upload a file to Firebase Storage and return its public download URL. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  if (!storageEnabled) {
    throw new Error("File uploads need Firebase Storage to be configured.");
  }
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(getStorage(firebaseApp()), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
