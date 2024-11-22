import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "./firebase";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

const Signin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();
    const toast = useToast();

    const signInWithGoogle = async () => {
        try {
            setIsLoading(true);

            // Google Sign-In
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Fetch the user document from Firestore using the UID
            const userDocRef = doc(firestore, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                setIsLoading(false);
                toast({
                    title: "Account not found",
                    description: "Your account is not in the system.",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
                return; // Exit the flow
            }

            const userData = userDocSnap.data();
            if (!userData.role) {
                setIsLoading(false);
                toast({
                    title: "Access Denied",
                    description: "Your account does not have a role.",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
                return; // Exit the flow
            }

            // Get Firebase ID token and authenticate with backend
            const firebaseToken = await user.getIdToken();
            const { data: mainData, status: mainStatus } = await axios.post(
                "https://alltech.gachara.store/api/firebase-auth/",
                { idToken: firebaseToken },
                { headers: { "Content-Type": "application/json" } }
            );

            if (mainStatus === 200) {
                localStorage.setItem("access", mainData.access);
                localStorage.setItem("refresh",mainData.refresh);
                navigate("/");
            }
        } catch (error) {
            console.error("Error during sign-in:", error);
            toast({
                title: "Sign-In Failed",
                description: error.message || "An unexpected error occurred.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");

    return (
        <Flex
            justify="center"
            align="center"
            minH="100vh"
            bg={useColorModeValue("gray.50", "gray.900")}
            position="relative"
            overflow="hidden"
        >
            <Box
                bg={bgColor}
                p={8}
                borderRadius="xl"
                boxShadow="2xl"
                maxW="400px"
                w="90%"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                zIndex={1}
            >
                <Heading
                    as="h2"
                    size="2xl"
                    textAlign="center"
                    mb={8}
                    color={textColor}
                >
                    ALLTECH SHOP 1
                </Heading>
                <Button
                    leftIcon={<FcGoogle />}
                    mt={4}
                    colorScheme="gray"
                    variant="outline"
                    width="full"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Signing in"
                    onClick={signInWithGoogle}
                    _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                >
                    Sign in with Google
                </Button>
            </Box>
        </Flex>
    );
};

export default Signin;
