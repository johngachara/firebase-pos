import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Flex,
    Text,
    Button,
    Heading,
    SimpleGrid,
    Badge,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Skeleton,
    useColorModeValue,
    VStack,
    HStack,
    SkeletonText,
    Container,
    Icon,
    Divider,
    Input,
    InputGroup,
    InputLeftElement,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaUndo, FaSearch } from "react-icons/fa";
import Navbar from "./Navbar";
import { get, onValue, push, ref, remove, serverTimestamp, set, update } from "firebase/database";
import { database } from "./firebase.js";
import useAuth from "../customHooks/useAuth";
import { client } from "./commonVariables";
import toast, { Toaster } from 'react-hot-toast';

// Firebase refs
const savedRef = ref(database, 'alltech/Saved');
const completeRef = ref(database, 'alltech/Complete');
const receiptRef = ref(database, 'alltech/Receipt');

const MotionBox = motion.create(Box);

function useFirebaseOperations() {
    const completeOrder = useCallback(async (item) => {
        try {
            const { id, product_name, price, customer_name, product_id } = item;
            const dataToSend = {
                product_name,
                price,
                quantity: 1,
                customer_name,
                timestamp: serverTimestamp(),
                product_id,
            };

            const newCompleteRef = push(completeRef);
            const newReceiptRef = push(receiptRef);
            await set(newCompleteRef, dataToSend);
            await set(newReceiptRef, dataToSend);

            const deleteRef = ref(database, `alltech/Saved/${id}`);
            await remove(deleteRef);
            toast.success('Order completed successfully');
        } catch (error) {
            toast.error('Failed to complete order');
            throw error;
        }
    }, []);

    const refundOrder = useCallback(async (item) => {
        try {
            const { id, product_name, product_id } = item;
            const productRef = ref(database, `alltech/LCD/${product_id}`);
            const snapshot = await get(productRef);
            if (snapshot.exists()) {
                const product = snapshot.val();
                const dataToSend = {
                    product_name,
                    quantity: product.quantity + 1,
                    timestamp: serverTimestamp(),
                };
                await update(productRef, dataToSend);

                await client.index('LCD').updateDocuments([{
                    id: product_id,
                    product_name: product_name,
                    quantity: product.quantity + 1,
                }]);

                const deleteRef = ref(database, `alltech/Saved/${id}`);
                await remove(deleteRef);
                toast.success('Order refunded successfully');
            } else {
                toast.error('Unable to find item');
            }
        } catch (error) {
            toast.error('Failed to refund order');
            throw error;
        }
    }, []);

    return { completeOrder, refundOrder };
}

export default function Saved() {
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(false);
    const cancelRef = useRef();
    const [alertState, setAlertState] = useState({ isOpen: false, itemId: null });
    const [refundState, setRefundState] = useState(false);
    const { completeOrder, refundOrder } = useFirebaseOperations();
    const [searchTerm, setSearchTerm] = useState("");

    useAuth();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onValue(savedRef, (snapshot) => {
            const transactionArray = [];
            snapshot.forEach((childSnapshot) => {
                const childKey = childSnapshot.key;
                const childData = childSnapshot.val();
                transactionArray.push({
                    id: childKey,
                    ...childData,
                    timestamp: childData.timestamp || 0
                });
            });
            transactionArray.sort((a, b) => b.timestamp - a.timestamp);
            setShopData(transactionArray);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const complete = useCallback(async (id) => {
        try {
            const item = shopData.find((item) => item.id === id);
            if (!item) {
                throw new Error('Item not found');
            }
            await completeOrder(item);
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    }, [shopData, completeOrder]);

    const refund = useCallback(async (id) => {
        try {
            setRefundState(true);
            const item = shopData.find((item) => item.id === id);
            if (!item) {
                throw new Error('Item not found');
            }
            await refundOrder(item);
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setRefundState(false);
            setAlertState(prevState => ({ ...prevState, isOpen: false, itemId: null }));
        }
    }, [shopData, refundOrder]);

    const bgColor = useColorModeValue("gray.50", "gray.900");
    const cardBgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.300");
    const headingColor = useColorModeValue("gray.800", "white");

    const filteredShopData = shopData?.filter(item =>
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderShopItem = useCallback(
        (item, index) => (
            <MotionBox
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="xl"
                bg={cardBgColor}
                _hover={{ transform: "translateY(-5px)", boxShadow: "2xl" }}
            >
                <Flex direction="column" h="100%">
                    <Box
                        bg="blue.500"
                        color="white"
                        p={4}
                        fontWeight="bold"
                        fontSize={{ base: "lg", md: "xl" }}
                    >
                        <Text isTruncated>{item.customer_name}</Text>
                    </Box>

                    <VStack p={6} align="stretch" spacing={4} flex={1}>
                        <Flex justify="space-between" align="center">
                            <Badge
                                colorScheme="teal"
                                fontWeight="bold"
                                fontSize="sm"
                                textTransform="uppercase"
                                px={2}
                                py={1}
                                borderRadius="full"
                            >
                                Unpaid
                            </Badge>
                            <Text fontWeight="bold" color={textColor} fontSize={{ base: "lg", md: "xl" }}>
                                {parseFloat(item.price).toFixed(2)}
                            </Text>
                        </Flex>

                        <Divider />

                        <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                            <strong>Product:</strong> {item.product_name}
                        </Text>

                        <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                            <strong>Quantity:</strong> {item.quantity}
                        </Text>

                        <Divider />

                        <HStack spacing={4} mt="auto">
                            <Button
                                onClick={() => complete(item.id)}
                                colorScheme="blue"
                                size={{ base: "sm", md: "md" }}
                                flex={1}
                                leftIcon={<Icon as={FaShoppingCart} />}
                            >
                                Complete
                            </Button>
                            <Button
                                onClick={() => setAlertState({ isOpen: true, itemId: item.id })}
                                colorScheme="red"
                                size={{ base: "sm", md: "md" }}
                                flex={1}
                                leftIcon={<Icon as={FaUndo} />}
                            >
                                Refund
                            </Button>
                        </HStack>
                    </VStack>
                </Flex>
            </MotionBox>
        ),
        [cardBgColor, textColor, complete]
    );

    return (
        <Box bg={bgColor} minH="100vh">
            <Navbar />
            <Box ml={{ base: 0, md: "240px" }} transition="margin-left 0.3s ease">
                <Container maxW="container.xl" py={12}>
                    <Heading
                        as="h2"
                        size="2xl"
                        textAlign="center"
                        color={headingColor}
                        mb={12}
                    >
                        SHOP 1 UNPAID ORDERS
                    </Heading>

                    <InputGroup mb={8}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FaSearch} color="gray.300" />
                        </InputLeftElement>
                        <Input
                            type="text"
                            placeholder="Search by customer or product name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg={cardBgColor}
                        />
                    </InputGroup>

                    {loading && (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                            {[...Array(6)].map((_, index) => (
                                <Box
                                    key={index}
                                    borderRadius="xl"
                                    overflow="hidden"
                                    boxShadow="lg"
                                    bg={cardBgColor}
                                >
                                    <Skeleton height="200px" />
                                    <Box p={6}>
                                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                                        <Skeleton height="40px" mt="4" />
                                    </Box>
                                </Box>
                            ))}
                        </SimpleGrid>
                    )}

                    <AnimatePresence>
                        {filteredShopData && (
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                                {filteredShopData.map(renderShopItem)}
                            </SimpleGrid>
                        )}
                    </AnimatePresence>
                </Container>

                <AlertDialog
                    isOpen={alertState.isOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={() => setAlertState({ isOpen: false, itemId: null })}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Return Item
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                Are you sure you want to refund this item?
                            </AlertDialogBody>
                            <AlertDialogFooter>
                                <Button
                                    ref={cancelRef}
                                    onClick={() =>
                                        setAlertState({ isOpen: false, itemId: null })
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="green"
                                    onClick={() => refund(alertState.itemId)}
                                    isLoading={refundState}
                                    loadingText="Refunding"
                                    ml={3}
                                >
                                    Refund
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
                <Toaster position="bottom-right" />
            </Box>
        </Box>
    );

}