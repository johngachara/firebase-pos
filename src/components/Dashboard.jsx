import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    useToast,
    Skeleton,
} from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './Navbar';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    // Define the months array for month names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Function to get the month name from the month index
    const getMonthName = (monthIndex) => {
        return monthNames[monthIndex - 1]; // Adjust month to 0-based index
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

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetchWithAuth('https://alltech.gachara.store/api/shop1/dashboard/');
                if (!response) return;

                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    status: 'error',
                    title: 'Error fetching data',
                    description: error.message,
                });
            }
        };

        fetchDashboardData();
    }, []);


    return (
        <Flex direction="column" ml={{ base: 0, md: '250px' }} p={5}>
            <Navbar />
            <Box flex="1" p={5}>
                <Heading mb={5}>Admin Dashboard</Heading>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10} mb={10}>
                    <Stat>
                        <StatLabel>Total Sales</StatLabel>
                        <StatNumber>{data?.total_sales?.toFixed(2) || <Skeleton height="30px" width="100px" />}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Top Product</StatLabel>
                        <StatNumber>{data?.top_products[0][0] || <Skeleton height="30px" width="100px" />}</StatNumber>
                        <StatHelpText>{data?.top_products[0][1] || <Skeleton height="20px" width="80px" />} units</StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>Top Customer</StatLabel>
                        {data?.frequent_customers.length > 0 ? (
                            <>
                                <StatNumber>{data.frequent_customers[0][0] || <Skeleton height="30px" width="100px" />}</StatNumber>
                                <StatHelpText>
                                    {data.frequent_customers[0][1] || <Skeleton height="20px" width="80px" />} transactions
                                </StatHelpText>
                            </>
                        ) : (
                            <>
                                <StatNumber>No Data Available</StatNumber>
                                <StatHelpText>Check back later</StatHelpText>
                            </>
                        )}
                    </Stat>
                </SimpleGrid>

                <Flex direction={{ base: 'column', lg: 'row' }} gap={10} mb={10}>
                    <Box flex={1}>
                        <Heading size="md" mb={3}>Monthly Sales Trend</Heading>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={
                                    data?.monthly_sales_trend.map(([year_month, sales]) => {
                                        const [year, month] = year_month;
                                        return {
                                            month: getMonthName(month),  // Get month name based on the second value (month)
                                            sales
                                        };
                                    }) || []
                                }
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="sales" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                    <Box flex={1}>
                        <Heading size="md" mb={3}>Top Selling Products</Heading>
                        <Table variant="simple">
                            <TableCaption>Top 5 Selling Products</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Product</Th>
                                    <Th isNumeric>Quantity</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data?.top_products.map((product, index) => (
                                    <Tr key={index}>
                                        <Td>{product[0]}</Td>
                                        <Td isNumeric>{product[1]}</Td>
                                    </Tr>
                                )) || (
                                    <>
                                        {[1, 2, 3, 4, 5].map((_, index) => (
                                            <Tr key={index}>
                                                <Td><Skeleton height="20px" width="150px" /></Td>
                                                <Td isNumeric><Skeleton height="20px" width="100px" /></Td>
                                            </Tr>
                                        ))}
                                    </>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Flex>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
                    <Box>
                        <Heading size="md" mb={3}>Frequent Customers</Heading>
                        <Table variant="simple">
                            <TableCaption>Top 5 Frequent Customers</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Customer</Th>
                                    <Th isNumeric>Transactions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data?.frequent_customers.slice(0, 5).map((customer, index) => (
                                    <Tr key={index}>
                                        <Td>{customer[0]}</Td>
                                        <Td isNumeric>{customer[1]}</Td>
                                    </Tr>
                                )) || (
                                    <>
                                        {[1, 2, 3, 4, 5].map((_, index) => (
                                            <Tr key={index}>
                                                <Td><Skeleton height="20px" width="150px" /></Td>
                                                <Td isNumeric><Skeleton height="20px" width="100px" /></Td>
                                            </Tr>
                                        ))}
                                    </>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                    <Box>
                        <Heading size="md" mb={3}>High Value Customers</Heading>
                        <Table variant="simple">
                            <TableCaption>Top 5 High Value Customers</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Customer</Th>
                                    <Th isNumeric>Total Spend</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data?.high_value_customers.map((customer, index) => (
                                    <Tr key={index}>
                                        <Td>{customer[0]}</Td>
                                        <Td isNumeric>{customer[1]}</Td>
                                    </Tr>
                                )) || (
                                    <>
                                        {[1, 2, 3, 4, 5].map((_, index) => (
                                            <Tr key={index}>
                                                <Td><Skeleton height="20px" width="150px" /></Td>
                                                <Td isNumeric><Skeleton height="20px" width="100px" /></Td>
                                            </Tr>
                                        ))}
                                    </>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </SimpleGrid>
            </Box>
        </Flex>
    );
};

export default Dashboard;
