/**
 * Firebase Configuration and Auth Exports
 * Uses Firebase SDK v10 via CDN
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBaQZ1xGHxKecQBDKY1e2a8gV6B8xhxu5Y",
    authDomain: "youngin-fb727.firebaseapp.com",
    projectId: "youngin-fb727",
    storageBucket: "youngin-fb727.firebasestorage.app",
    messagingSenderId: "17128404672",
    appId: "1:17128404672:web:2de20021f2830faa87df25",
    measurementId: "G-PSNCJB9072"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    collection,
    addDoc,
    query,
    where,
    getDocs
};
