import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Flex,
    Button,
    useColorModeValue,
    Box,
    IconButton,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    VStack,
    Text,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useBreakpointValue,
    Spinner,
    useColorMode,
} from "@chakra-ui/react";
import { HamburgerIcon, ChevronDownIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUserRole } from "../customHooks/useUserRole";

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const location = useLocation();
    const { userRole, isLoading } = useUserRole();

    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const activeColor = useColorModeValue("blue.500", "blue.300");

    const isMobile = useBreakpointValue({ base: true, md: false });
    const { colorMode, toggleColorMode } = useColorMode(); // Theme toggle hook

    const Logout = async () => {
        localStorage.removeItem("access");
        await auth.signOut();
        navigate("/Login");
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate("/Login");
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [navigate]);

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, children, onClick }) => (
        <Button
            as={Link}
            to={to}
            color={isActive(to) ? activeColor : textColor}
            fontWeight={isActive(to) ? "bold" : "normal"}
            variant="ghost"
            justifyContent="flex-start"
            width="100%"
            onClick={onClick}
        >
            {children}
        </Button>
    );

    const NavMenu = ({ onItemClick }) => (
        <VStack align="stretch" spacing={2}>
            <NavItem to="/" onClick={onItemClick}>
                Screens
            </NavItem>
            <NavItem to="/Accessories" onClick={onItemClick}>
                Accessories
            </NavItem>
            <NavItem to="/AddAccessory" onClick={onItemClick}>
                Add Accessories
            </NavItem>
            <NavItem to="/AddLcd" onClick={onItemClick}>
                Add Screen
            </NavItem>
            <NavItem to="/Transactions" onClick={onItemClick}>
                Unpaid Orders
            </NavItem>
            <NavItem to="/LowStock" onClick={onItemClick}>
                Low Stock
            </NavItem>
            {userRole === "admin" && (
                <>
                    <NavItem to="/Admin" onClick={onItemClick}>
                        Admin Dashboard
                    </NavItem>
                    <NavItem to="/detailed" onClick={onItemClick}>
                        Shop Details
                    </NavItem>
                </>
            )}
            <Button onClick={() => window.location.reload()} variant="ghost">
                Refresh
            </Button>
        </VStack>
    );

    const SidebarContent = () => (
        <>
            {isLoading ? (
                <Flex justify="center" align="center" h="200px">
                    <Spinner />
                </Flex>
            ) : (
                <>
                    <NavMenu onItemClick={isMobile ? onClose : undefined} />
                </>
            )}
        </>
    );

    if (isMobile) {
        return (
            <>
                <Box position="fixed" top={3} right={4} zIndex={20}>
                    <IconButton
                        aria-label="Open menu"
                        icon={<HamburgerIcon />}
                        onClick={onOpen}
                    />
                </Box>
                <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                    <DrawerOverlay>
                        <DrawerContent bg={bgColor}>
                            <DrawerCloseButton />
                            <DrawerHeader>Menu</DrawerHeader>
                            <DrawerBody>
                                {/* Sidebar Content */}
                                <SidebarContent />

                                {/* Avatar Menu for Mobile */}
                                <Box mt="auto" pt={4}>
                                    <Flex justify="space-between" align="center">
                                        {/* Theme Toggle Button */}
                                        <IconButton
                                            aria-label="Toggle theme"
                                            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                                            onClick={toggleColorMode}
                                            variant="ghost"
                                        />
                                        <Menu>
                                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" size="sm" width="100%">
                                                <Flex align="center">
                                                    <Avatar size="sm" name={user?.email.replace("@gmail.com", "")} src={user?.photoURL} mr={2} />
                                                    <Text>{user?.email.replace("@gmail.com", "")}</Text>
                                                </Flex>
                                            </MenuButton>
                                            <MenuList>
                                                <MenuItem onClick={Logout}>Logout</MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Flex>
                                </Box>
                            </DrawerBody>
                        </DrawerContent>
                    </DrawerOverlay>
                </Drawer>
            </>
        );
    }


    return (
        <Box
            bg={bgColor}
            w="250px"
            h="100vh"
            position="fixed"
            left={0}
            top={0}
            boxShadow="sm"
            p={4}
            zIndex={20}
        >
            <Flex direction="column" h="full">
                <Box mb={6}>
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>
                        ALLTECH
                    </Text>
                </Box>

                <SidebarContent />

                <Box mt="auto">
                    <Flex justify="space-between" align="center">
                        {/* Theme Toggle Button */}
                        <IconButton
                            aria-label="Toggle theme"
                            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                            onClick={toggleColorMode}
                            variant="ghost"
                        />
                        <Menu>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" size="sm" width="100%">
                                <Flex align="center">
                                    <Avatar size="sm" name={user?.email.replace("@gmail.com", "")} src={user?.photoURL} mr={2} />
                                    <Text>{user?.email.replace("@gmail.com", "")}</Text>
                                </Flex>
                            </MenuButton>
                            <MenuList>
                                <MenuItem onClick={Logout}>Logout</MenuItem>
                            </MenuList>
                        </Menu>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}
