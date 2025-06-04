// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ← your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAb4EbbRBhZoYtW9gWWEnP20St4rj_QUME",
  authDomain: "shopping-cart-app-ded95.firebaseapp.com",
  projectId: "shopping-cart-app-ded95",
  storageBucket: "shopping-cart-app-ded95.appspot.com",
  messagingSenderId: "538095404600",
  appId: "1:538095404600:web:1089030e963cda4cad48cd"
};

// initialize and export auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
