import React from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import LanguageSelector from '../components/Language/LanguageSelector';
import TranslationManager from '../components/Language/TranslationManager';

const I18nPage: React.FC = () => {
    return (
        <Box minH="100vh" bg="gray.50">
            <Tabs variant="enclosed" colorScheme="blue" size="lg">
                <TabList>
                    <Tab>언어 선택</Tab>
                    <Tab>번역 관리</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <Box p={6} maxW="800px" mx="auto">
                            <LanguageSelector variant="menu" showStats={true} />
                        </Box>
                    </TabPanel>
                    <TabPanel>
                        <TranslationManager />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default I18nPage;
