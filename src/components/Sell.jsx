import {useState, useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Input,
    Button,
    Heading,
    Text,
    Skeleton,
    SkeletonText,
    useToast,
    List,
    ListItem, useColorModeValue,
} from "@chakra-ui/react";
import Navbar from "./Navbar";
import {
    get,
    onValue,
    push,
    ref,
    serverTimestamp,
    set,
    update
} from "firebase/database";
import { database } from "./firebase.js";
import {client} from "./commonVariables";
import useAuth from "../customHooks/useAuth";

export default function Sell() {
    const [stock, setData] = useState(null);
    const [customer, setCustomer] = useState("");
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerPreview, setShowCustomerPreview] = useState(false);
    const navigate = useNavigate();
    const [send, setSend] = useState(false);
    const [sellingPrice, setSellingPrice] = useState(0.0);
    const {id} = useParams();
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const hoverColor = useColorModeValue("gray.200", "gray.600");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const [completeB, setComplete] = useState(false);
    const productRef = ref(database, `alltech/LCD/${id}`);
    const savedRef = ref(database, 'alltech/Saved');
    const compleRef = ref(database, 'alltech/Complete');
    const receiptRef = ref(database, 'alltech/Receipt');
    const toast = useToast();
    useAuth();

    const complete = async (id) => {
        if(!validateForm()){
            return;
        }
        setComplete(true);
        const dataToSend = {
            product_name: stock.product_name,
            price: sellingPrice,
            quantity: 1,
            customer_name: customer,
            timestamp: serverTimestamp(),
            product_id: id
        };
        const updateQuantity = {
            product_name: stock.product_name,
            price: sellingPrice,
            quantity: (stock.quantity - 1),
            timestamp: serverTimestamp(),
        };

        try {
            await update(productRef, updateQuantity);
            const newPostRef = push(savedRef);
            await set(newPostRef, dataToSend);

            const updateProduct = await client.index('LCD').updateDocuments([{
                id: id,
                product_name: stock.product_name,
                quantity: (stock.quantity - 1),
                price: stock.price,
            }]);

            if(updateProduct.status === "enqueued"){
                toast({
                    status: "success",
                    description: "Product sold successfully",
                    position: "top"
                });
                navigate('/');
            } else {
                throw new Error("Failed to sell product");
            }
        } catch (error) {
            setComplete(false);
            toast({
                status: "error",
                description: "Error occurred while selling product",
                position: "top"
            });
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const snapshot = await get(productRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setData(data);
                    setSellingPrice(data.price);
                } else {
                    toast({
                        status: "error",
                        description: "Product does not exist",
                        position: "top"
                    });
                }
            } catch (error) {
                toast({
                    status: "error",
                    description: "Error occurred while fetching product",
                    position: "top"
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
                status: "error",
                description: "Product name cannot be empty",
                position: "top"
            });
            return false;
        }
        if (isNaN(stock.quantity) || stock.quantity < 0) {
            toast({
                status: "error",
                description: "quantity must be a positive number",
                position: "top"
            });
            return false;
        }
        if (isNaN(sellingPrice) || sellingPrice < 0) {
            toast({
                status: "error",
                description: "Price must be a positive number",
                position: "top"
            });
            return false;
        }
        if (!customer.trim() || !/^[a-zA-Z\s]+$/.test(customer)) {
            toast({
                status: "error",
                description: "Customer name is required",
                position: "top"
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if(!validateForm()){
            return;
        }
        setSend(true);

        try {
            const dataToSend = {
                product_name: stock.product_name,
                price: sellingPrice,
                quantity: 1,
                customer_name: customer,
                timestamp: serverTimestamp(),
                product_id: id
            };
            const updateQuantity = {
                product_name: stock.product_name,
                price: sellingPrice,
                quantity: (stock.quantity - 1),
                timestamp: serverTimestamp(),
            };

            await update(productRef, updateQuantity);
            const newPostRef = push(compleRef);
            const newReceipt = push(receiptRef);
            await set(newPostRef, dataToSend);
            await set(newReceipt, dataToSend);

            const updateProduct = await client.index('LCD').updateDocuments([{
                id: id,
                product_name: stock.product_name,
                quantity: (stock.quantity - 1),
                price: stock.price,
            }]);

            if(updateProduct.status === "enqueued"){
                toast({
                    status: 'success',
                    description: 'Item sold successfully',
                });
                navigate('/');
            } else {
                throw new Error("Failed to update product");
            }
        } catch (error) {
            setSend(false);
            toast({
                status: 'error',
                description: 'Error updating product',
            });
        }
    };

    function handleDecimalsOnValue(value) {
        const regex = /([0-9]*[\.|\,]{0,1}[0-9]{0,2})/s;
        return value.match(regex)[0];
    }

    function checkValue(event) {
        setSellingPrice(handleDecimalsOnValue(event.target.value));
    }

    return (
        <div>
            <Navbar />
            <Box mt={20}>
                <Heading as="h2" size="xl" textAlign="center" color={textColor} mb={4}>
                    Sell Screen
                </Heading>
                {stock ? (
                    <Flex justify="center" alignItems="center" color={bgColor} direction="column">
                        <Box
                            as="form"
                            onSubmit={handleSubmit}
                            color={bgColor}
                            maxW={{base: "90%", md: "md"}}
                            width="full"
                            px={4}
                            position="relative"
                        >
                            <Text color={textColor} mb={2}>Product</Text>
                            <Input color={textColor} value={stock.product_name} isReadOnly mb={4}/>
                            <Text color={textColor} mb={2}>Quantity</Text>
                            <Input color={textColor} value={1} isReadOnly mb={4}/>
                            <Text color={textColor} mb={2}>Selling Price</Text>
                            <Input
                                required={true}
                                value={sellingPrice}
                                color={textColor}
                                type="number"
                                onChange={(event) => checkValue(event)}
                                mb={4}
                            />
                            <Text color={textColor} mb={2}>Customer</Text>
                            <Input
                                value={customer}
                                color={textColor}
                                required={true}
                                type="text"
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                mb={4}
                            />
                            {showCustomerPreview && filteredCustomers.length > 0 && (
                                <Box
                                    position="absolute"
                                    zIndex={1}
                                    color={textColor}  // Use the defined constant
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
                                    isDisabled={send}
                                    isLoading={completeB}
                                    loadingText="Saving"
                                    onClick={() => complete(id)}
                                    width="full"
                                    mr={2}
                                >
                                    Save
                                </Button>
                                <Button
                                    colorScheme="blue"
                                    isLoading={send}
                                    isDisabled={completeB}
                                    loadingText="Completing"
                                    width="full"
                                    type="submit"
                                    ml={2}
                                >
                                    Complete
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