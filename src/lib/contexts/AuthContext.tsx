"use client";

import React, { createContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isNewUser: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth State Changed:', { user });
      if (user) {
        setUser(user);
        // Check if user has completed survey
        const surveyDoc = await getDoc(doc(db, 'user_surveys', user.uid));
        const isNew = !surveyDoc.exists();
        console.log('Survey check:', { isNew, surveyExists: surveyDoc.exists() });
        setIsNewUser(isNew);
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google Sign In:', { user: result.user });
      // Check if user has completed survey
      const surveyDoc = await getDoc(doc(db, 'user_surveys', result.user.uid));
      const isNew = !surveyDoc.exists();
      console.log('Survey check after Google sign in:', { isNew });
      setIsNewUser(isNew);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Email Sign Up:', { user: result.user });
      setIsNewUser(true); // New user by definition when signing up
      console.log('Set isNewUser to true for new email signup');
    } catch (error) {
      console.error('Email Sign Up Error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email Sign In:', { user: result.user });
      // Check if user has completed survey
      const surveyDoc = await getDoc(doc(db, 'user_surveys', result.user.uid));
      const isNew = !surveyDoc.exists();
      console.log('Survey check after email sign in:', { isNew });
      setIsNewUser(isNew);
    } catch (error) {
      console.error('Email Sign In Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isNewUser,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

