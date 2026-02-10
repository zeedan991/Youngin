/**
 * Database Service
 * Handles all Firestore interactions
 */

import { db, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, collection, addDoc, query, where, getDocs } from './firebase_config.js';

/**
 * Creates a new user profile in Firestore
 * @param {Object} user - The user object from Auth
 */
export async function createUserProfile(user) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        await setDoc(userRef, {
            name: user.displayName || "Youngin Designer",
            email: user.email,
            xp: 100, // Starter XP
            level: 1,
            joinedAt: new Date().toISOString(),
            designs: [],
            measurements: null
        });
    }
}

/**
 * Fetches user profile data
 * @param {string} uid 
 * @returns {Object|null} User data or null
 */
export async function getUserProfile(uid) {
    if (!uid) return null;
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error("Firestore Read Error:", e);
        return null;
    }
}

/**
 * Saves a new design to the global designs collection
 * @param {Object} designData - Must include userId
 */
export async function saveDesign(designData) {
    try {
        const docRef = await addDoc(collection(db, 'designs'), {
            createdAt: new Date().toISOString(),
            ...designData
        });
        return docRef.id;
    } catch (e) {
        console.error("Error saving design:", e);
        throw e;
    }
}

/**
 * Gets designs for a specific user
 * @param {string} userId 
 */
export async function getDesigns(userId) {
    try {
        const q = query(collection(db, 'designs'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching designs:", e);
        return [];
    }
}

/**
 * Saves AI Measurements
 * @param {string} uid 
 * @param {Object} measurements 
 */
export async function saveMeasurements(uid, measurements) {
    if (!uid) return;
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
        measurements: measurements,
        lastScanDate: new Date().toISOString()
    });
}

/**
 * Updates User XP
 * @param {string} uid 
 * @param {number} newTotalXP 
 */
export async function updateUserXP(uid, newTotalXP) {
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        xp: newTotalXP
    });
}

/**
 * Deletes a design from Firestore
 * @param {string} designId - The ID of the design to delete
 * @returns {Promise<void>}
 */
export async function deleteDesign(designId) {
    if (!designId) {
        throw new Error('Design ID is required');
    }

    try {
        const designRef = doc(db, 'designs', designId);
        await deleteDoc(designRef);
    } catch (e) {
        console.error('Error deleting design:', e);
        throw e;
    }
}
/**
 * Updates User Gamification Stats (XP, Level, Badges, Credibility)
 * @param {string} uid 
 * @param {Object} stats - { xp, level, credibility, streak, badges }
 */
export async function updateGamificationStats(uid, stats) {
    if (!uid) return;
    const userRef = doc(db, "users", uid);

    try {
        await updateDoc(userRef, {
            ...stats,
            lastUpdated: new Date().toISOString()
        });
        // Gamification stats updated successfully

    } catch (e) {
        console.error("Error updating gamification stats:", e);
    }
}
