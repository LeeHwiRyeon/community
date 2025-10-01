import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    HStack,
    Text,
    Box,
    Badge,
    Divider,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Code,
    Flex,
    Switch,
    FormControl,
    FormLabel,
    Tooltip,
    useDisclosure
} from '@chakra-ui/react';
import {
    keyboardShortcuts,
    formatShortcutDisplay,
    keyboardShortcutManager
} from '../utils/keyboardShortcuts';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
    isOpen,
    onClose
}) => {
    const [isShortcutsEnabled, setIsShortcutsEnabled] = useState(
        keyboardShortcutManager.isShortcutEnabled()
    );

    const toggleShortcuts = () => {
        const newState = !isShortcutsEnabled;
        setIsShortcutsEnabled(newState);
        keyboardShortcutManager.setEnabled(newState);
    };

    const shortcutsByCategory = {
        actions: keyboardShortcuts.filter(s => s.category === 'actions'),
        navigation: keyboardShortcuts.filter(s => s.category === 'navigation'),
        system: keyboardShortcuts.filter(s => s.category === 'system')
    };

    const renderShortcutTable = (shortcuts: typeof keyboardShortcuts) => (
        <Table size="sm" variant="simple">
            <Thead>
                <Tr>
                    <Th>Shortcut</Th>
                    <Th>Action</Th>
                    <Th>Description</Th>
                </Tr>
            </Thead>
            <Tbody>
                {shortcuts.map((shortcut, index) => (
                    <Tr key={index}>
                        <Td>
                            <Code fontSize="sm" colorScheme="blue">
                                {formatShortcutDisplay(shortcut)}
                            </Code>
                        </Td>
                        <Td>
                            <Badge colorScheme="green" fontSize="xs">
                                {shortcut.action.replace('create', '').replace('Action', '')}
                            </Badge>
                        </Td>
                        <Td>
                            <Text fontSize="sm">{shortcut.description}</Text>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Flex justify="space-between" align="center">
                        <Text>Keyboard Shortcuts</Text>
                        <FormControl display="flex" alignItems="center" width="auto">
                            <FormLabel htmlFor="shortcuts-toggle" mb="0" fontSize="sm">
                                Enable Shortcuts
                            </FormLabel>
                            <Switch
                                id="shortcuts-toggle"
                                isChecked={isShortcutsEnabled}
                                onChange={toggleShortcuts}
                                colorScheme="blue"
                            />
                        </FormControl>
                    </Flex>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={6} align="stretch">
                        {/* Introduction */}
                        <Box p={4} bg="blue.50" borderRadius="md">
                            <Text fontSize="sm" color="blue.700">
                                Use keyboard shortcuts to quickly execute actions without clicking buttons.
                                All shortcuts work globally when not typing in input fields.
                            </Text>
                        </Box>

                        {/* Action Shortcuts */}
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={3} color="green.600">
                                Action Shortcuts
                            </Text>
                            <Text fontSize="sm" color="gray.600" mb={3}>
                                Quick access to all action types
                            </Text>
                            {renderShortcutTable(shortcutsByCategory.actions)}
                        </Box>

                        <Divider />

                        {/* Navigation Shortcuts */}
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={3} color="blue.600">
                                Navigation Shortcuts
                            </Text>
                            <Text fontSize="sm" color="gray.600" mb={3}>
                                Navigate between pages and content
                            </Text>
                            {renderShortcutTable(shortcutsByCategory.navigation)}
                        </Box>

                        <Divider />

                        {/* System Shortcuts */}
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={3} color="purple.600">
                                System Shortcuts
                            </Text>
                            <Text fontSize="sm" color="gray.600" mb={3}>
                                General system functions
                            </Text>
                            {renderShortcutTable(shortcutsByCategory.system)}
                        </Box>

                        {/* Tips */}
                        <Box p={4} bg="gray.50" borderRadius="md">
                            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                                💡 Tips:
                            </Text>
                            <VStack spacing={1} align="start">
                                <Text fontSize="xs" color="gray.600">
                                    • Shortcuts are disabled when typing in input fields
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                    • Use Ctrl+1-5 to quickly jump to pages 1-5
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                    • Press Escape to clear current action
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                    • Press Ctrl+H to toggle this help dialog
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                    • All shortcuts work with sound effects when enabled
                                </Text>
                            </VStack>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default KeyboardShortcutsHelp;
