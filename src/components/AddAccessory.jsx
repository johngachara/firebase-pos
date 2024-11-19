import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Flex, FormControl, FormLabel, Input, Button, useColorModeValue, VStack, HStack, Heading, useToast
} from "@chakra-ui/react";
import { push, serverTimestamp, set } from "firebase/database";
import Navbar from "./Navbar.jsx";
import { accessoryRef, client } from "./commonVariables";
import useProductExists from "../customHooks/useProductExists";
import useAuth from "../customHooks/useAuth";
import useForm from "../customHooks/useForm";
import useValidate from "../customHooks/useValidate";

export default function AddAccessory() {
    const [saving, setSaving] = useState(false);
    const { data, handleChange } = useForm({
        product_name: "",
        quantity: "",
        price: "",
    });
    const { isValid, validate } = useValidate();
    const flexColor = useColorModeValue("gray.100", "gray.900");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const boxColor = useColorModeValue("white", "gray.800");
    const inputTextColor = useColorModeValue("black", "white");
    const inputBgColor = useColorModeValue("white", "gray.700");

    const dataRef = accessoryRef;
    const navigate = useNavigate();
    const { exists, checkProductExists } = useProductExists();
    const toast = useToast();
    useAuth();
    // check whether product exists and all fields have been filled to update isvalid state as typing is ongoing
    useEffect(() => {
        if (data.product_name) {
            checkProductExists(data.product_name,'Accessory');
        }
       validate(data)
    }, [ checkProductExists,data,validate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await checkProductExists(data.product_name,'Accessory');
            // stop execution if product exists
            if (exists) {
                toast({
                    status : 'error',
                    description : 'Item already exists'
                })
                setSaving(false);
                return;
            }

            const newPostRef = push(dataRef);   // initialize db ref
            //data from form
            const newProductData = {
                product_name: data.product_name,
                quantity: parseInt(data.quantity),
                price: parseFloat(data.price),
                timestamp: serverTimestamp()
            };
            await set(newPostRef, newProductData);  // Add data to accessory db
            // Add data to meilisearch
            const response = await client.index("Shop1Accessory").addDocuments([
                {
                    product_name: newProductData.product_name,
                    id: newPostRef.key,
                    quantity: newProductData.quantity,
                    price: newProductData.price
                }
            ]);

            if (response.status === "enqueued") {
                toast({
                    status : 'success',
                    description : 'Item added successfully'
                })
                navigate('/Accessories');
            } else {
                throw new Error("Unable to add product to MeiliSearch");
            }
        } catch (error) {
            toast({
                status : 'error',
                description : error.message
            })
            console.error('Error saving data:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <Navbar />
            <Flex
                justifyContent="center"
                alignItems="center"
                minH="90vh"
                bg={flexColor}
                px={{ base: 4, md: 8 }}
                py={{ base: 4, md: 8 }}
            >
                <Box
                    bg={boxColor}
                    p={{ base: 4, md: 8 }}
                    borderRadius="md"
                    boxShadow="lg"
                    maxW={{ base: "full", sm: "md" }}
                    width="100%"
                >
                    <form onSubmit={handleSubmit}>
                        <Heading as="h2" size="xl" textAlign="center" color={textColor} mb={4}>
                            Add Accessory
                        </Heading>
                        <VStack spacing={4}>
                            <FormControl id="product_name">
                                <FormLabel>Product Name</FormLabel>
                                <Input
                                    type="text"
                                    color={inputTextColor}
                                    bg={inputBgColor}
                                    _focus={{ borderColor: "blue.500" }} // Focus border color
                                    value={data.product_name}
                                    onChange={handleChange}
                                    name="product_name"
                                />
                            </FormControl>
                            <FormControl id="quantity">
                                <FormLabel>Quantity</FormLabel>
                                <Input
                                    type="number"
                                    color={inputTextColor}
                                    bg={inputBgColor}
                                    _focus={{ borderColor: "blue.500" }}
                                    value={data.quantity}
                                    onChange={handleChange}
                                    name="quantity"
                                />
                            </FormControl>
                            <FormControl id="price">
                                <FormLabel>Selling Price</FormLabel>
                                <Input
                                    type="number"
                                    color={inputTextColor}
                                    bg={inputBgColor}
                                    _focus={{ borderColor: "blue.500" }}
                                    value={data.price}
                                    onChange={handleChange}
                                    name="price"
                                />
                            </FormControl>
                            <HStack width="100%">
                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    isDisabled={!isValid}
                                    isLoading={saving}
                                    loadingText="Saving"
                                    width="100%"
                                >
                                    Save
                                </Button>
                            </HStack>
                        </VStack>
                    </form>
                </Box>
            </Flex>
        </div>
    );
}
