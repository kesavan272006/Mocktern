import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAODcAMNTG8I5ttp8mOIwxGvG6XBBnhP_k",
  authDomain: "mocktern.firebaseapp.com",
  projectId: "mocktern",
  storageBucket: "mocktern.firebasestorage.app",
  messagingSenderId: "895893740588",
  appId: "1:895893740588:web:6813aeb0f54208d6e38589",
  measurementId: "G-S7PTNSYM9F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleprovider = new GoogleAuthProvider(app);
export const database = getFirestore(app);