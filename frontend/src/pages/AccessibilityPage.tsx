import React from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import AccessibilityDashboard from '../components/Accessibility/AccessibilityDashboard';
import AccessibilitySettings from '../components/Accessibility/AccessibilitySettings';

const AccessibilityPage: React.FC = () => {
    return (
        <Box minH="100vh" bg="gray.50">
            <Tabs variant="enclosed" colorScheme="blue" size="lg">
                <TabList>
                    <Tab>접근성 테스트</Tab>
                    <Tab>접근성 설정</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <AccessibilityDashboard />
                    </TabPanel>
                    <TabPanel>
                        <AccessibilitySettings />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default AccessibilityPage;
