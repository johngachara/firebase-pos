import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    useToast,
    VStack,
    Text,
    Alert,
    AlertIcon,
    AlertDescription,
} from "@chakra-ui/react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "./firebase";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

// Constants
const LAST_USER_KEY = "last_user_id";
const API_BASE_URL = "https://alltech.gachara.store/api";

// Utils
const arrayBufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const generateDeviceId = () => {
    const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio
        },
        timestamp: Date.now()
    };
    return btoa(JSON.stringify(deviceInfo)).replace(/[/+=]/g, '');
};

const SignIn = () => {
    // State management
    const [authState, setAuthState] = useState({
        isLoading: false,
        error: null,
        webAuthnAvailable: false,
        hasRegisteredWebAuthn: false,
        deviceId: generateDeviceId()
    });

    // Hooks
    const navigate = useNavigate();
    const toast = useToast();
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");

    // WebAuthn Support Check
    useEffect(() => {
        const checkWebAuthnSupport = async () => {
            try {
                if (!window.PublicKeyCredential) {
                    return;
                }

                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                setAuthState(prev => ({ ...prev, webAuthnAvailable: available }));

                const lastUserId = localStorage.getItem(LAST_USER_KEY);
                if (!lastUserId) return;

                const userDoc = await getDoc(doc(firestore, "users", lastUserId));
                if (!userDoc.exists()) return;

                const credentials = userDoc.data().webAuthnCredentials || [];
                const hasDevice = credentials.some(
                    cred => cred.deviceId === authState.deviceId &&
                        cred.hostname === window.location.hostname
                );

                setAuthState(prev => ({ ...prev, hasRegisteredWebAuthn: hasDevice }));
            } catch (error) {
                console.error("WebAuthn support check failed:", error);
                setAuthState(prev => ({ ...prev, webAuthnAvailable: false }));
            }
        };

        checkWebAuthnSupport();
    }, [authState.deviceId]);

    // Auth state observer
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                localStorage.removeItem(LAST_USER_KEY);
                setAuthState(prev => ({ ...prev, hasRegisteredWebAuthn: false }));
            }
        });

        return () => unsubscribe();
    }, []);

    // WebAuthn Registration
    const registerWebAuthn = async (userId, userEmail, userName) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const challenge = window.crypto.getRandomValues(new Uint8Array(32));
            const createOptions = {
                challenge,
                rp: {
                    name: "ALLTECH SHOP 1",
                    id: window.location.hostname
                },
                user: {
                    id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                    name: userEmail,
                    displayName: userName
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "cross-platform",
                    userVerification: "preferred",
                    requireResidentKey: false
                },
                timeout: 60000,
                attestation: "none"
            };

            const credential = await navigator.credentials.create({
                publicKey: createOptions
            });

            const credentialData = {
                id: credential.id,
                rawId: arrayBufferToBase64(credential.rawId),
                type: credential.type,
                attestationObject: arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
                deviceId: authState.deviceId,
                hostname: window.location.hostname,
                dateAdded: new Date().toISOString()
            };

            const userRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userRef);
            const existingCredentials = userDoc.exists() ?
                (userDoc.data().webAuthnCredentials || []) : [];

            const updatedCredentials = existingCredentials.filter(
                cred => cred.deviceId !== authState.deviceId ||
                    cred.hostname !== window.location.hostname
            );
            updatedCredentials.push(credentialData);

            await updateDoc(userRef, {
                webAuthnCredentials: updatedCredentials,
                lastUpdated: new Date().toISOString()
            });

            setAuthState(prev => ({ ...prev, hasRegisteredWebAuthn: true }));
            localStorage.setItem(LAST_USER_KEY, userId);

            toast({
                title: "Security key registered",
                description: "Fingerprint authentication enabled for this device",
                status: "success",
                duration: 3000
            });

            return true;
        } catch (error) {
            console.error("WebAuthn registration failed:", error);
            toast({
                title: "Registration failed",
                description: error.message,
                status: "error",
                duration: 5000
            });
            return false;
        } finally {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // WebAuthn Authentication
    const authenticateWithWebAuthn = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const lastUserId = localStorage.getItem(LAST_USER_KEY);
            if (!lastUserId) {
                throw new Error("No registered device found");
            }

            const userDoc = await getDoc(doc(firestore, "users", lastUserId));
            if (!userDoc.exists()) {
                throw new Error("User not found");
            }

            const credentials = userDoc.data().webAuthnCredentials || [];
            const deviceCredentials = credentials.filter(
                cred => cred.hostname === window.location.hostname
            );

            if (!deviceCredentials.length) {
                throw new Error("No credentials found for this device");
            }

            const challenge = window.crypto.getRandomValues(new Uint8Array(32));
            const assertionOptions = {
                challenge,
                allowCredentials: deviceCredentials.map(cred => ({
                    id: base64ToArrayBuffer(cred.rawId),
                    type: 'public-key',
                    transports: ['internal']
                })),
                timeout: 60000,
                userVerification: "preferred",
                rpId: window.location.hostname
            };

            const assertion = await navigator.credentials.get({
                publicKey: assertionOptions
            });

            if (!assertion) {
                throw new Error("Authentication failed");
            }

            // Get Firebase token
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("Firebase session expired");
            }

            const firebaseToken = await currentUser.getIdToken(true);
            const response = await axios.post(
                `${API_BASE_URL}/firebase-auth/`,
                { idToken: firebaseToken },
                { headers: { "Content-Type": "application/json" }}
            );

            if (response.status === 200) {
                localStorage.setItem("access", response.data.access);
                localStorage.setItem("refresh", response.data.refresh);
                navigate("/");
            }
        } catch (error) {
            console.error("WebAuthn authentication failed:", error);
            setAuthState(prev => ({
                ...prev,
                error: error.message,
                hasRegisteredWebAuthn: false
            }));
            toast({
                title: "Authentication failed",
                description: error.message,
                status: "error",
                duration: 5000
            });
        } finally {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Google Sign In
    const signInWithGoogle = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const { user } = result;

            if (!user) {
                throw new Error("Authentication failed");
            }

            // Get or create user document
            const userRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Create new user document
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
            } else {
                // Update last login
                await updateDoc(userRef, {
                    lastLogin: new Date().toISOString()
                });
            }

            // Get tokens
            const firebaseToken = await user.getIdToken(true);
            const response = await axios.post(
                `${API_BASE_URL}/firebase-auth/`,
                { idToken: firebaseToken },
                { headers: { "Content-Type": "application/json" }}
            );

            if (response.status === 200) {
                localStorage.setItem("access", response.data.access);
                localStorage.setItem("refresh", response.data.refresh);
                localStorage.setItem(LAST_USER_KEY, user.uid);

                // Prompt for WebAuthn registration
                if (authState.webAuthnAvailable && !authState.hasRegisteredWebAuthn) {
                    const shouldRegister = window.confirm(
                        "Would you like to enable fingerprint authentication for faster sign-in?"
                    );

                    if (shouldRegister) {
                        await registerWebAuthn(
                            user.uid,
                            user.email,
                            user.displayName
                        );
                    }
                }

                navigate("/");
            }
        } catch (error) {
            console.error("Google sign-in failed:", error);
            setAuthState(prev => ({
                ...prev,
                error: error.message,
                hasRegisteredWebAuthn: false
            }));
            toast({
                title: "Sign-in failed",
                description: error.message,
                status: "error",
                duration: 5000
            });
        } finally {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Reset WebAuthn
    const resetWebAuthn = useCallback(() => {
        localStorage.removeItem(LAST_USER_KEY);
        setAuthState(prev => ({ ...prev, hasRegisteredWebAuthn: false }));
        toast({
            title: "Authentication reset",
            description: "You can now sign in with Google",
            status: "info",
            duration: 3000
        });
    }, [toast]);

    return (
        <Flex
            justify="center"
            align="center"
            minH="100vh"
            bg={useColorModeValue("gray.50", "gray.900")}
            position="relative"
        >
            <Box
                bg={bgColor}
                p={8}
                borderRadius="xl"
                boxShadow="2xl"
                maxW="400px"
                w="90%"
                border="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
            >
                <VStack spacing={6}>
                    <Heading
                        as="h2"
                        size="2xl"
                        textAlign="center"
                        color={textColor}
                    >
                        ALLTECH SHOP 1
                    </Heading>

                    {authState.error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>{authState.error}</AlertDescription>
                        </Alert>
                    )}

                    {authState.webAuthnAvailable && authState.hasRegisteredWebAuthn ? (
                        <>
                            <Button
                                colorScheme="purple"
                                width="full"
                                size="lg"
                                isLoading={authState.isLoading}
                                loadingText="Verifying"
                                onClick={authenticateWithWebAuthn}
                            >
                                Sign in with Fingerprint
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={resetWebAuthn}
                            >
                                Switch to Google Sign-in
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                leftIcon={<FcGoogle />}
                                colorScheme="gray"
                                variant="outline"
                                width="full"
                                size="lg"
                                isLoading={authState.isLoading}
                                loadingText="Signing in"
                                onClick={signInWithGoogle}
                                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                            >
                                Sign in with Google
                            </Button>
                            {authState.webAuthnAvailable && (
                                <Text fontSize="sm" textAlign="center" color={textColor}>
                                    Sign in with Google to enable fingerprint authentication
                                </Text>
                            )}
                        </>
                    )}
                </VStack>
            </Box>
        </Flex>
    );
};

export default SignIn;