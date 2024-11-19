import React, { useState, useEffect } from "react";
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
    Input,
    VStack,
    HStack,
    Text,
    useToast,
} from "@chakra-ui/react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const LowStock = () => {
    const [data, setData] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const columns = ["product_name", "quantity"];

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
                    Authorization: `Bearer ${localStorage.getItem("access")}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 401 && retryCount === 0) {
                try {
                    await refreshToken();
                    return fetchWithAuth(url, 1);
                } catch (refreshError) {
                    navigate("/Login");
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
            if (!response) return;

            const jsonData = await response.json();
            setData((prevData) => [...prevData, ...jsonData.results]);
            setNextPage(jsonData.next);
        } catch (error) {
            console.error("Error fetching data:", error);
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
        fetchData("https://alltech.gachara.store/api/shop1/detailed/lowstock/");
    }, []);

    // Rest of the component remains the same
    const loadMore = () => {
        if (nextPage) {
            fetchData(nextPage);
        }
    };

    const filteredData = data.filter((item) =>
        Object.values(item).some((value) =>
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <Box minH="100vh">
            <Navbar />
            <Box ml={{ base: 0, md: "250px" }} p={4}>
                <VStack spacing={5} align="stretch">
                    <Heading>Shop 1 Low Stock Data</Heading>

                    <HStack>
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </HStack>

                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                {columns.map((column) => (
                                    <Th key={column}>{column.replace("_", " ").toUpperCase()}</Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredData.map((item, index) => (
                                <Tr key={index}>
                                    {columns.map((column) => (
                                        <Td key={column}>
                                            {column === "quantity"
                                                ? `${item[column]}`
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

export default LowStock;