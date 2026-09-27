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

/**
 * Compress an image file to max 1000px dimension and convert to high-efficiency data URL.
 * Stored directly in Firestore document payload.
 */
export function compressAndEncodeImage(file: File, maxDimension = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      // Fallback for non-images
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        // Fallback if canvas 2d context is unavailable
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Upload a file to Firebase Storage (if configured) or encode as an optimized
 * compressed data URL to store directly with the Firestore document.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  if (storageEnabled) {
    try {
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${folder}/${Date.now()}-${safeName}`;
      const storageRef = ref(getStorage(firebaseApp()), path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.warn("Firebase Storage upload failed, storing optimized image directly:", err);
    }
  }

  // Stored directly in Firestore document
  return compressAndEncodeImage(file);
}
