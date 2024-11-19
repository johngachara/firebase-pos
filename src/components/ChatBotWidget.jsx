import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Drawer,
    DrawerContent,
    DrawerCloseButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
    Button,
    Text
} from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';
import AskAi from './AskAi';

function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const checkAndShowIntro = () => {
            const lastShownDate = localStorage.getItem('chatbotIntroLastShown1');
            const today = new Date().toDateString();

            if (!lastShownDate || lastShownDate !== today) {
                const timer = setTimeout(() => setShowIntro(true), 2000);
                return () => clearTimeout(timer);
            }
        };

        checkAndShowIntro();
    }, []);

    const onOpen = () => {
        setIsOpen(true);
        setShowIntro(false);
        updateLastShownDate();
    };

    const onClose = () => setIsOpen(false);

    const handleIntroClose = () => {
        setShowIntro(false);
        updateLastShownDate();
    };

    const updateLastShownDate = () => {
        const today = new Date().toDateString();
        localStorage.setItem('chatbotIntroLastShown1', today);
    };

    return (
        <>
            <Box position="fixed" bottom="20px" right="20px" zIndex="1000">
                <Popover
                    isOpen={showIntro}
                    onClose={handleIntroClose}
                    placement="top-end"
                    closeOnBlur={false}
                >
                    <PopoverTrigger>
                        <IconButton
                            icon={<ChatIcon />}
                            onClick={onOpen}
                            colorScheme="blue"
                            size="lg"
                            borderRadius="full"
                            boxShadow="lg"
                        />
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontWeight="bold">Need Help?</PopoverHeader>
                        <PopoverBody>
                            <Text>
                              Chat with the New Alltech AI
                            </Text>
                        </PopoverBody>
                        <PopoverFooter display="flex" justifyContent="flex-end">
                            <Button colorScheme="blue" size="sm" onClick={onOpen}>
                                Ask a Question
                            </Button>
                        </PopoverFooter>
                    </PopoverContent>
                </Popover>
            </Box>

            <Drawer placement="right" onClose={onClose} isOpen={isOpen} size="md">
                <DrawerContent display="flex" flexDirection="column" height="100vh">
                    <DrawerCloseButton />
                    <Box flex="1" overflowY="auto">
                        <AskAi />
                    </Box>
                </DrawerContent>
            </Drawer>
        </>
    );
}

export default ChatbotWidget;
