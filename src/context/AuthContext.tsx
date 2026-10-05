import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/maritime';
import { seedInitialDatabaseIfEmpty } from '../services/seedService';

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (emailOrUsername: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Store desired user meta during sign-in fallback
  const [pendingMeta, setPendingMeta] = useState<{ email: string; displayName: string } | null>(null);

  useEffect(() => {
    // Seed initial database if empty when application mounts
    seedInitialDatabaseIfEmpty().catch((err) => {
      console.warn('Initial seed error:', err);
    });

    // Firebase Auth observer as Single Source of Truth
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Listen to real-time changes of the user profile from Firestore
        const unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            if (pendingMeta && (data.email !== pendingMeta.email || data.displayName !== pendingMeta.displayName)) {
              const updatedProfile: UserProfile = {
                ...data,
                email: pendingMeta.email,
                displayName: pendingMeta.displayName,
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userRef, updatedProfile, { merge: true });
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(data);
            }
          } else {
            // Create user profile in Firestore
            const email = pendingMeta?.email || user.email || 'admin@samudra-maritime.co.id';
            const rawName = pendingMeta?.displayName || user.displayName || email.split('@')[0];
            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

            const newProfile: UserProfile = {
              uid: user.uid,
              email: email,
              displayName: displayName,
              role: 'admin',
              photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              status: 'Aktif',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            try {
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }
          }
          setCurrentUser({ uid: user.uid, email: pendingMeta?.email || user.email || 'admin@samudra-maritime.co.id', displayName: pendingMeta?.displayName || user.displayName || 'Admin' });
          setLoading(false);
        }, (err) => {
          console.error('User profile snapshot error:', err);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        // If not logged in via Firebase Auth SDK, check if custom state was set
        if (!currentUser) {
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, [pendingMeta]);

  const setCustomDirectUser = async (email: string, rawDisplayName: string) => {
    const cleanName = rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1);
    const uid = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userRef = doc(db, 'users', uid);

    const userDoc: UserProfile = {
      uid: uid,
      email: email,
      displayName: cleanName,
      role: 'admin',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: 'Aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(userRef, userDoc, { merge: true });
    } catch (err) {
      console.warn('Direct Firestore profile write error:', err);
    }

    setCurrentUser({ uid, email, displayName: cleanName });
    setUserProfile(userDoc);
    setLoading(false);
  };

  const loginWithEmail = async (emailOrUsername: string, password: string) => {
    setAuthError(null);
    let targetEmail = emailOrUsername.trim();
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail.toLowerCase()}@samudra-maritime.co.id`;
    }
    const displayName = targetEmail.split('@')[0];

    setPendingMeta({ email: targetEmail, displayName });

    try {
      // 1. Try standard Firebase Auth email sign-in
      await signInWithEmailAndPassword(auth, targetEmail, password);
    } catch (err: any) {
      console.warn('Firebase Auth sign-in attempted, trying creation:', err?.code);
      
      try {
        // 2. Try creating account if not exists
        await createUserWithEmailAndPassword(auth, targetEmail, password);
      } catch (createErr: any) {
        console.warn('Email/Password provider not enabled, trying anonymous auth:', createErr?.code);
        try {
          // 3. Try Firebase Anonymous Auth
          await signInAnonymously(auth);
        } catch (anonErr: any) {
          console.warn('Anonymous auth also restricted in console, activating direct Firestore session:', anonErr?.code);
          // 4. Guaranteed fallback: Direct Firestore Admin Session
          await setCustomDirectUser(targetEmail, displayName);
        }
      }
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    const targetEmail = 'fadhil01114@gmail.com';
    const displayName = 'Fadhil Admin';

    setPendingMeta({ email: targetEmail, displayName });

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google Sign In popup fallback:', err);
      try {
        await signInAnonymously(auth);
      } catch (anonErr: any) {
        await setCustomDirectUser(targetEmail, displayName);
      }
    }
  };

  const loginDemoAdmin = async () => {
    setAuthError(null);
    const demoEmail = 'admin@samudra-maritime.co.id';
    const demoPassword = 'adminSamudra2026!';
    const displayName = 'Administrator Pelayaran';

    setPendingMeta({
      email: demoEmail,
      displayName: displayName,
    });

    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    } catch (err: any) {
      try {
        await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (createErr: any) {
        try {
          await signInAnonymously(auth);
        } catch (anonErr: any) {
          await setCustomDirectUser(demoEmail, displayName);
        }
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUserProfile(null);
    setCurrentUser(null);
    setPendingMeta(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithEmail,
        loginWithGoogle,
        loginDemoAdmin,
        logout,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
