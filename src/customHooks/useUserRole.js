import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../components/firebase"

export function useUserRole() {
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setUserRole(null);
                setIsLoading(false);
                return;
            }

            try {
                const userRef = doc(firestore, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUserRole(userData.role || 'user');
                } else {
                    setUserRole('user');
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                setUserRole('user');
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { userRole, isLoading };
}