import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../components/firebase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {firestore} from '../components/firebase'
export default function useAuth() {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                toast.error("You must be logged in to access this page");
                navigate('/Login');
                return;
            }

            try {
                // Check if user exists in Firestore
                const userRef = doc(firestore, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // User not found in Firestore
                    toast.error("You don't have permission to access this page");
                    await auth.signOut();
                    navigate('/Login');
                    return;
                }

            } catch (error) {
                console.error("Error checking user permissions:", error);
                toast.error("An error occurred while checking permissions");
                await auth.signOut();
                navigate('/Login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);
}