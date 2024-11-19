import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Select,
    Input,
    VStack,
    HStack,
    Text,
    useToast
} from '@chakra-ui/react';
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const DetailedDataView = () => {
    const [data, setData] = useState([]);
    const [dataType, setDataType] = useState('lowstock');
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const columns = {
        sales: ['product_name', 'price', 'quantity', 'customer_name'],
        products: ['product_name', 'total_quantity'],
        lowstock: ['product_name', 'quantity'],
    };

    const refreshToken = async () => {
        try {
            const response = await fetch('https://alltech.gachara.store/api/refresh-token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: localStorage.getItem('refresh')
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            localStorage.setItem('access', data.access);
            return data.access;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    };

    const fetchWithAuth = async (url, retryCount = 0) => {
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 401 && retryCount === 0) {
                // Try to refresh the token
                try {
                    const newToken = await refreshToken();
                    // Retry the original request with the new token
                    return fetchWithAuth(url, 1);
                } catch (refreshError) {
                    // If refresh fails, redirect to login
                    navigate('/Login');
                    return null;
                }
            }

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    const fetchData = async (url) => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(url);
            if (!response) return; // Response is null if we've redirected to login

            const jsonData = await response.json();
            setData(prevData => [...prevData, ...jsonData.results]);
            setNextPage(jsonData.next);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error fetching data",
                description: "There was an error loading the data. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        setData([]);
        fetchData(`https://alltech.gachara.store/api/shop1/detailed/${dataType}/`);
    }, [dataType]);

    const loadMore = () => {
        if (nextPage) {
            fetchData(nextPage);
        }
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(value =>
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <Box minH="100vh">
            <Navbar />
            <Box ml={{ base: 0, md: "250px" }} p={4}>
                <VStack spacing={5} align="stretch">
                    <Heading>Shop 1 {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Data</Heading>

                    <HStack>
                        <Select value={dataType} onChange={(e) => setDataType(e.target.value)}>
                            <option value="lowstock">LOW STOCK</option>
                            <option value="sales">LCD & TOUCH SALES</option>
                            <option value="products">LCD & TOUCH SALES PER PRODUCT</option>
                        </Select>
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </HStack>

                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                {columns[dataType].map((column) => (
                                    <Th key={column}>{column.replace('_', ' ').toUpperCase()}</Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredData.map((item, index) => (
                                <Tr key={index}>
                                    {columns[dataType].map((column) => (
                                        <Td key={column}>
                                            {column.includes('price') || column.includes('spend')
                                                ? `$${parseInt(item[column]).toFixed(2)}`
                                                : item[column]}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>

                    {filteredData.length === 0 && (
                        <Text>No results found. Try adjusting your search.</Text>
                    )}

                    <Button
                        onClick={loadMore}
                        isLoading={isLoading}
                        loadingText="Loading..."
                        isDisabled={!nextPage || isLoading}
                    >
                        Load More
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
};

export default DetailedDataView;