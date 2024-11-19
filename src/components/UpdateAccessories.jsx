import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Input,
    Button,
    FormControl, FormLabel, Heading, SkeletonText, Skeleton, useToast, useColorModeValue,
} from "@chakra-ui/react";
import Navbar from "./Navbar";
import { database} from "./firebase.js";
import {get, ref,update} from "firebase/database";
import {client} from "./commonVariables";
import useAuth from "../customHooks/useAuth";
export default function UpdateAccessories() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const productRef = ref(database, `alltech/Accessory/${id}`);
    const toast = useToast();
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    useAuth()
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const snapshot = await get(productRef);
                if (snapshot.exists()) {
                    setData(snapshot.val());
                } else {
                    toast({
                        status : 'error',
                        description : 'Item doesnt exist'
                    })
                }
            } catch (error) {
                console.error("Error fetching product:", error.message);
                toast({
                    status : 'error',
                    description : error.message
                })
            }
        };

        fetchProduct();

    }, [id]);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    const validateForm = () => {
        if (!data.product_name.trim()) {
            toast({
                status: "error",
                description: "Product name is required",
            })
            return false;
        }
        if (isNaN(data.quantity) || data.quantity < 0) {
            toast({
                status: "error",
                description: "Quantity must be a positive number",
            })
            return false;
        }
        if (isNaN(data.price) || data.price <= 0) {
            toast({
                status: "error",
                description: "Price must be a positive number",
            })
            return false;
        }
        return true;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSending(true)
        if(!validateForm()) {
            setSending(false)
            return;
        }
        try {
            await update(productRef,data).then(()=>{
            }).catch(()=>{
                toast({
                    status : 'error',
                    description : 'Unable to update product'
                })
            })
            const updateProduct = await client.index('Shop1Accessory').updateDocuments([{
                id:id,
                product_name:data.product_name,
                quantity : data.quantity,
                price : data.price,
            }])
            if(updateProduct.status === "enqueued"){
                toast({
                    status : 'success',
                    description : 'Item updated successfully'
                })
                navigate('/Accessories');
            }
            else {
                setSending(false)
                throw new Error('Unable to update product')
            }
        }catch (err){
            toast({
                status : 'error',
                description : err.message
            })
        }finally {
            setSending(false)
        }
    };

    return (
        <div>
            <Navbar />
            <Box mt={20}>
                {data ? <Flex
                    justifyContent="center"
                    alignItems="center"
                    minH="80vh"
                   bg={bgColor}
                    px={{base: 4, md: 8}}
                    py={{base: 4, md: 8}}
                >
                    <Box
                        p={{base: 4, md: 8}}
                        borderRadius="md"
                        bg={bgColor}
                        boxShadow="lg"
                        maxW={{base: "full", sm: "md"}}
                        width="100%"
                    >
                        <form onSubmit={handleSubmit}>
                            <Heading as="h2" size="xl" textAlign="center" color={textColor} mb={4}>
                                Update Accessories
                            </Heading>
                            <FormControl id="product_name" mb={4}>
                                <FormLabel>Product Name</FormLabel>
                                <Input
                                    type="text"
                                    required={true}
                                    color={textColor}
                                    value={data?.product_name || ""}
                                    onChange={handleChange}
                                    name="product_name"
                                />
                            </FormControl>
                            <FormControl id="quantity" mb={4}>
                                <FormLabel>Quantity</FormLabel>
                                <Input
                                    type="number"
                                    required={true}
                                    value={data?.quantity || ""}
                                    onChange={handleChange}
                                    color={textColor}
                                    name="quantity"
                                />
                            </FormControl>
                            <FormControl id="price" mb={6}>
                                <FormLabel>Selling Price</FormLabel>
                                <Input
                                    type="number"
                                    required={true}
                                    value={data?.price || ""}
                                    onChange={handleChange}
                                    color={textColor}
                                    name="price"
                                />
                            </FormControl>
                            <Button
                                type="submit"
                                colorScheme="blue"
                                isLoading={sending}
                                loadingText="Saving"
                                width="100%"
                            >
                                Save
                            </Button>
                        </form>
                    </Box>
                </Flex> : (
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