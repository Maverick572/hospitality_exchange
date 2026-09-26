"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";

import { firebaseAuth, firebaseEnabled } from "@/lib/firebase";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  demoMode: boolean;
  signIn: (email: string, password: string, opts?: { driver?: boolean }) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    opts?: { driver?: boolean },
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const DEMO_TOKEN_KEY = "hrx-demo-token";
const DEMO_USER_KEY = "hrx-demo-user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private window) — the session just won't persist.
  }
}

/**
 * Demo tokens follow the backend's development bypass: `test-<slug>` maps to
 * uid `user_<slug>`, and a token containing "driver" carries the driver role.
 */
function demoToken(email: string, driver: boolean) {
  const slug = email
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "guest";
  return driver ? `test-driver-${slug}` : `test-${slug}`;
}

function demoUserFromToken(token: string, email: string, name?: string): AuthUser {
  return {
    uid: token.replace("test-", "user_"),
    email,
    displayName: name ?? null,
  };
}

/** Current ID token for API calls, or null when signed out. */
export async function getIdToken(): Promise<string | null> {
  if (firebaseEnabled) {
    const current = firebaseAuth().currentUser;
    return current ? current.getIdToken() : null;
  }
  return readStorage(DEMO_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (firebaseEnabled) {
      return onAuthStateChanged(firebaseAuth(), (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          });
          setStatus("signedIn");
        } else {
          setUser(null);
          setStatus("signedOut");
        }
      });
    }

    const token = readStorage(DEMO_TOKEN_KEY);
    const stored = readStorage(DEMO_USER_KEY);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
        setStatus("signedIn");
        return;
      } catch {
        // fall through to signed out
      }
    }
    setStatus("signedOut");
  }, []);

  const startDemoSession = useCallback(
    (email: string, driver: boolean, name?: string) => {
      const token = demoToken(email, driver);
      const demoUser = demoUserFromToken(token, email, name);
      writeStorage(DEMO_TOKEN_KEY, token);
      writeStorage(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      setStatus("signedIn");
    },
    [],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password, opts) => {
      if (!firebaseEnabled) {
        startDemoSession(email, Boolean(opts?.driver));
        return;
      }
      await signInWithEmailAndPassword(firebaseAuth(), email, password);
    },
    [startDemoSession],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (email, password, name, opts) => {
      if (!firebaseEnabled) {
        startDemoSession(email, Boolean(opts?.driver), name);
        return;
      }
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth(),
        email,
        password,
      );
      if (name) {
        await updateProfile(credential.user, { displayName: name });
        setUser((current) => (current ? { ...current, displayName: name } : current));
      }
    },
    [startDemoSession],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseEnabled) {
      throw new Error("Google sign-in needs the Firebase web config in .env.local.");
    }
    await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseEnabled) {
      await firebaseSignOut(firebaseAuth());
      return;
    }
    writeStorage(DEMO_TOKEN_KEY, null);
    writeStorage(DEMO_USER_KEY, null);
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      demoMode: !firebaseEnabled,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [status, user, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/** Turn Firebase's error codes into something a person can act on. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Log in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    default:
      return error instanceof Error ? error.message : "Something went wrong.";
  }
}
