import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Flex,
    Button,
    InputGroup,
    Input,
    SimpleGrid,
    Badge,
    Text,
    Heading,
    useToast,
    AlertDialogFooter,
    AlertDialog,
    AlertDialogBody,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Skeleton,
    VStack,
    HStack,
    useColorModeValue,
    InputRightElement,
    Icon,
    Container
} from "@chakra-ui/react";
import { database } from "./firebase.js";
import { ref, remove } from "firebase/database";
import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import useAuth from "../customHooks/useAuth";
import usePagination from "../customHooks/usePagination";
import { useSearch } from "../customHooks/useSearch";
import { accessoryRef, client } from "./commonVariables";
import { motion } from "framer-motion";
import { DeleteIcon, SearchIcon, EditIcon } from "@chakra-ui/icons";
const MotionBox = motion.create(Box);

export default function Accessories() {
    const dataRef = accessoryRef;
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const PAGE_SIZE = 12;
    const { products, hasMore, loading: paginationLoading, error: paginationError, loadMore } = usePagination(dataRef, PAGE_SIZE);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const {
        searchParam,
        setSearchParam,
        searchResults,
        searchLoading,
        error: searchError,
        setSearchResults
    } = useSearch('', 'Shop1Accessory', 300);
    const toast = useToast();
    const cancelRef = useRef();

    useAuth();

    useEffect(() => {
        if (paginationError) {
            toast({ title: "Error loading items", description: paginationError.message, status: "error" });
        }
        if (searchError) {
            toast({ title: searchError.title, status: searchError.status });
        }
    }, [paginationError, searchError, toast]);

    const handleDelete = async (id) => {
        setIsDeleting(true);
        try {
            const productRef = ref(database, `alltech/Accessory/${id}`);
            await remove(productRef);
            await client.index('Shop1Accessory').deleteDocument(id);
            setSearchResults([]);
            setSearchParam("");
            toast({ title: "Item deleted successfully", status: "success" });
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({ title: "Error deleting item", description: error.message, status: "error" });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };


    const renderItems = (items) => (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} w="full">
            {items.map((item, index) => (
                <MotionBox
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                    bg={bgColor}
                    _hover={{ boxShadow: "lg", transform: "translateY(-5px)" }}
                >
                    <Box p={5}>
                        <Heading size="md" mb={2} isTruncated>
                            {item.product_name}
                        </Heading>
                        <Text fontSize="2xl" fontWeight="bold" mb={2}>
                            {item.price}
                        </Text>
                        <Text color={textColor} mb={4}>
                            Quantity: {item.quantity}
                        </Text>
                        <Badge colorScheme="teal" mb={4}>
                            {item.quantity > 0 ? "In Stock" : "Out Of Stock"}
                        </Badge>
                        <HStack spacing={2} mt={4} wrap="wrap">
                            <Button
                                as={Link}
                                isDisabled={item?.quantity <= 0}
                                to={`/SellAccessory/${item.id}`}
                                colorScheme="blue"
                                size="sm"
                                flex={1}
                            >
                                Sell
                            </Button>
                            <Button
                                as={Link}
                                to={`/UpdateAccessory/${item.id}`}
                                leftIcon={<EditIcon />}
                                colorScheme="green"
                                variant="outline"
                                size="sm"
                            >
                                Update
                            </Button>
                            <Button
                                leftIcon={<DeleteIcon />}
                                colorScheme="red"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDeleteItemId(item.id);
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                Delete
                            </Button>
                        </HStack>
                    </Box>
                </MotionBox>
            ))}
        </SimpleGrid>
    );

    return (
        <Box bg={bgColor} minH="100vh" ml={{ base: 0, md: 60 }}>
            <Navbar />
            <Container maxW="container.xl" py={8}>
                <VStack spacing={8} align="stretch">
                    <Flex justify="space-between" align="center" wrap="wrap">
                        <Heading
                            as="h1"
                            size="2xl"
                            color={useColorModeValue("gray.800", "white")}
                            mb={{ base: 4, md: 0 }}
                        >
                            Shop 1 Accessories
                        </Heading>
                        <InputGroup maxW={{ base: "100%", md: "md" }}>
                            <Input
                                placeholder="Search accessories"
                                value={searchParam}
                                onChange={(e) => setSearchParam(e.target.value)}
                                borderRadius="full"
                            />
                            <InputRightElement>
                                <Icon as={SearchIcon} color="gray.500" />
                            </InputRightElement>
                        </InputGroup>
                    </Flex>

                    {paginationLoading || searchLoading ? (
                        <SimpleGrid
                            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                            spacing={6}
                            w="full"
                        >
                            {[...Array(PAGE_SIZE)].map((_, index) => (
                                <Skeleton key={index} height="200px" borderRadius="lg" />
                            ))}
                        </SimpleGrid>
                    ) : searchResults.length > 0 || products.length > 0 ? (
                        renderItems(searchResults.length > 0 ? searchResults : products)
                    ) : (
                        <Text fontSize="xl" textAlign="center">
                            No accessories found.
                        </Text>
                    )}

                    {searchResults.length === 0 && !searchLoading && hasMore && (
                        <Button
                            onClick={loadMore}
                            colorScheme="blue"
                            size="lg"
                            width="full"
                            mt={4}
                        >
                            Load More
                        </Button>
                    )}
                </VStack>
            </Container>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteDialogOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Item
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this accessory?
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                isLoading={isDeleting}
                                loadingText="Deleting"
                                colorScheme="red"
                                onClick={() => handleDelete(deleteItemId)}
                                ml={3}
                            >
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}