import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6drS3bsr_II4P5eQl3KnphC5XTAqpt9E",
  authDomain: "sensorial-515a6.firebaseapp.com",
  projectId: "sensorial-515a6",
  storageBucket: "sensorial-515a6.firebasestorage.app",
  messagingSenderId: "818418001391",
  appId: "1:818418001391:web:5a392225cb67892e28c21a",
  measurementId: "G-CD4QGT37Q6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
