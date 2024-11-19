import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Input,
    Button,
    Heading,
    Text,
    SkeletonText,
    Skeleton,
    useToast,
    List,
    ListItem, useColorModeValue,
} from "@chakra-ui/react";
import Navbar from "./Navbar";
import { get, onValue, push, ref, serverTimestamp, set, update } from "firebase/database";
import { database } from "./firebase.js";
import useAuth from "../customHooks/useAuth";
import { client } from "./commonVariables";

export default function SellAccessory() {
    const [stock, setData] = useState(null);
    const [customer, setCustomer] = useState("");
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerPreview, setShowCustomerPreview] = useState(false);
    const navigate = useNavigate();
    const [send, setSend] = useState(false);
    const [sellingPrice, setSellingPrice] = useState("");
    const [sellingQuantity, setSellingQuantity] = useState("");
    const { id } = useParams();
    const [completeB, setComplete] = useState(false);
    const productRef = ref(database, `alltech/Accessory/${id}`);
    const completeRef = ref(database, 'alltech/CompleteAccessory');
    const receiptRef = ref(database, 'alltech/ReceiptAccessory');
    const toast = useToast();
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const hoverColor = useColorModeValue("gray.200", "gray.600");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    useAuth();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const snapshot = await get(productRef);
                if (snapshot.exists()) {
                    const productData = snapshot.val();
                    setData(productData);
                    setSellingPrice(productData.price.toString());
                } else {
                    toast({
                        title: "Error",
                        description: "Unable to find item",
                        status: "error",
                        duration: 3000,
                        position: "top",
                    });
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    status: "error",
                    duration: 3000,
                    position: "top",
                });
            }
        };

        const fetchCustomers = () => {
            onValue(receiptRef, (snapshot) => {
                const items = snapshot.val();
                if (items) {
                    const customerSet = new Set();
                    Object.values(items).forEach(item => {
                        if (item.customer_name) {
                            customerSet.add(item.customer_name);
                        }
                    });
                    setCustomers(Array.from(customerSet));
                }
            });
        };

        fetchProduct();
        fetchCustomers();
    }, []);

    const handleCustomerSearch = (searchText) => {
        setCustomer(searchText);
        if (searchText.trim() === "") {
            setShowCustomerPreview(false);
            return;
        }

        const filtered = customers.filter(cust =>
            cust.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredCustomers(filtered);
        setShowCustomerPreview(true);
    };

    const selectCustomer = (selectedCustomer) => {
        setCustomer(selectedCustomer);
        setShowCustomerPreview(false);
    };

    const validateForm = () => {
        if (!stock.product_name.trim()) {
            toast({
                description: "Product name is required",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return false;
        }
        if (isNaN(sellingQuantity) || sellingQuantity <= 0) {
            toast({
                description: "Quantity must be a positive number",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return false;
        }
        if (sellingQuantity > stock.quantity) {
            toast({
                description: "Quantity in stock is insufficient",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return false;
        }
        if (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) <= 0) {
            toast({
                description: "Price must be a positive number",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return false;
        }
        if (!customer.trim() || !/^[a-zA-Z\s]+$/.test(customer)) {
            toast({
                description: "Customer name is required",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return false;
        }
        return true;
    };

    const complete = async () => {
        if (!validateForm()) {
            return;
        }
        setComplete(true);
        const dataToSend = {
            product_name: stock.product_name,
            price: parseFloat(sellingPrice) * sellingQuantity,
            quantity: sellingQuantity,
            customer_name: customer,
            timestamp: serverTimestamp(),
            product_id: id
        };

        const updateQuantity = {
            product_name: stock.product_name,
            price: stock.price,
            quantity: stock.quantity - sellingQuantity,
            timestamp: serverTimestamp(),
        };

        try {
            await update(productRef, updateQuantity);
            const newPostRef = push(completeRef);
            const receipt = push(receiptRef);
            await set(newPostRef, dataToSend);
            await set(receipt, dataToSend);

            const updateProduct = await client.index('Shop1Accessory').updateDocuments([{
                id: id,
                product_name: stock.product_name,
                quantity: stock.quantity - sellingQuantity,
                price: stock.price,
            }]);

            if (updateProduct.status === "enqueued") {

                toast({
                    status : 'success',
                    description: "Item successfully sold",
                })
                navigate('/Accessories');
            }
            else {
                throw new Error("Unable to sell product");
            }
        } catch (error) {
            setComplete(false);
            toast({
                description: "Error selling product",
                status: "error",
                duration: 3000,
                position: "top",
            });
        }
    };

    const handlePriceChange = (event) => {
        const value = event.target.value;
        // Allow empty string, numbers, and decimals
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setSellingPrice(value);
        }
    };

    return (
        <div>
            <Navbar />
            <Box mt={20}>
                <Heading as="h2" size="xl" textAlign="center" color={textColor} mb={4}>
                    Sell Accessory
                </Heading>
                {stock ? (
                    <Flex justify="center" alignItems="center" direction="column">
                        <Box
                            as="form"
                            maxW={{ base: "90%", md: "md" }}
                            width="full"
                            px={4}
                            color={bgColor}
                            position="relative"
                        >
                            <Text color={textColor} mb={2}>Product</Text>
                            <Input color={textColor} value={stock.product_name} isReadOnly mb={4} />
                            <Text color={textColor} mb={2}>Quantity</Text>
                            <Input
                                required
                                color={textColor}
                                value={sellingQuantity}
                                type="number"
                                onChange={(e) => setSellingQuantity(parseInt(e.target.value) || 0)}
                                mb={4}
                            />
                            <Text color={textColor} mb={2}>Selling Price</Text>
                            <Input
                                required
                                value={sellingPrice}
                                color={textColor}
                                onChange={handlePriceChange}
                                mb={4}
                            />
                            <Text color={textColor} mb={2}>Customer</Text>
                            <Input
                                value={customer}
                                color={textColor}
                                required
                                type="text"
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                mb={4}
                            />
                            {showCustomerPreview && filteredCustomers.length > 0 && (
                                <Box
                                    position="absolute"
                                    zIndex={1}
                                    color={textColor}
                                    width="100%"
                                    borderRadius="md"
                                    maxH="200px"
                                    overflowY="auto"
                                    boxShadow="md"
                                    bg={bgColor}
                                    border="1px solid"
                                    borderColor={borderColor}
                                >
                                    <List spacing={2}>
                                        {filteredCustomers.map((cust, index) => (
                                            <ListItem
                                                key={index}
                                                p={2}
                                                cursor="pointer"
                                                _hover={{ bg: hoverColor }}
                                                color={textColor}
                                                onClick={() => selectCustomer(cust)}
                                            >
                                                {cust}
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            <Flex justify="center">
                                <Button
                                    colorScheme="green"
                                    variant="outline"
                                    type="button"
                                    isDisabled={send}
                                    isLoading={completeB}
                                    loadingText="Completing"
                                    onClick={complete}
                                    width="full"
                                    ml={2}
                                >
                                    Sell
                                </Button>
                            </Flex>
                        </Box>
                    </Flex>
                ) : (
                    <Flex justify="center" alignItems="center" direction="column">
                        <Box maxW={{base: "90%", md: "md"}} width="full" px={4}>
                            <SkeletonText mt="4" noOfLines={1} spacing="4" skeletonHeight="8" />
                            <Skeleton height="40px" mt="4" />
                            <SkeletonText mt="4" noOfLines={1} spacing="4" skeletonHeight="8" />
                            <Skeleton height="40px" mt="4" />
                            <SkeletonText mt="4" noOfLines={1} spacing="4" skeletonHeight="8" />
                            <Skeleton height="40px" mt="4" />
                            <SkeletonText mt="4" noOfLines={1} spacing="4" skeletonHeight="8" />
                            <Skeleton height="40px" mt="4" />
                            <Flex justify="center" mt="4">
                                <Skeleton height="40px" width="50%" mr={2} />
                                <Skeleton height="40px" width="50%" ml={2} />
                            </Flex>
                        </Box>
                    </Flex>
                )}
            </Box>
        </div>
    );
}