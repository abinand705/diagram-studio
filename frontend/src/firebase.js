// ==================== FIREBASE CONFIGURATION ====================
// Now using environment variables for security (see .env.local)

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB5jRgii8gWdtuHkmKre3_mAM6-LiKqCjg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "smart-diagram-8ada3.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "smart-diagram-8ada3",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "smart-diagram-8ada3.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "111339137054",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:111339137054:web:ac0877578c6754fb3de60f",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-BW6LKPE9L7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ============ AUTH HELPERS ============

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ============ FIRESTORE HELPERS ============

// Save / overwrite a diagram for the current user
export const saveDiagramToCloud = async (userId, diagram) => {
  const id = diagram.id || `diagram_${Date.now()}`;
  await setDoc(doc(db, "users", userId, "diagrams", id), {
    ...diagram,
    id,
    updatedAt: serverTimestamp()
  });
  return id;
};

// Load a single diagram by id
export const loadDiagramFromCloud = async (userId, diagramId) => {
  const snap = await getDoc(doc(db, "users", userId, "diagrams", diagramId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// List all diagrams for the current user
export const listUserDiagrams = async (userId) => {
  const q = query(
    collection(db, "users", userId, "diagrams"),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Delete a diagram
export const deleteDiagramFromCloud = async (userId, diagramId) => {
  await deleteDoc(doc(db, "users", userId, "diagrams", diagramId));
};

// ============ SHARING HELPERS ============

// Share a diagram publicly by copying it to a global shared collection
export const shareDiagram = async (diagram) => {
  const shareId = `share_${Math.random().toString(36).substring(2, 15)}`;
  await setDoc(doc(db, "shared_diagrams", shareId), {
    ...diagram,
    sharedAt: serverTimestamp(),
    id: shareId
  });
  return shareId;
};

// Get a publicly shared diagram by shareId
export const getSharedDiagram = async (shareId) => {
  const snap = await getDoc(doc(db, "shared_diagrams", shareId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
