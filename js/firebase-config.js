// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq5hIZW7IDpKdOtJAgP4KFcxbTR_fn4Nk",
  authDomain: "steam-551c9.firebaseapp.com",
  projectId: "steam-551c9",
  storageBucket: "steam-551c9.firebasestorage.app",
  messagingSenderId: "680199770118",
  appId: "1:680199770118:web:24c68735a59a3ef7453387",
  measurementId: "G-1YY2HQF85Q"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
