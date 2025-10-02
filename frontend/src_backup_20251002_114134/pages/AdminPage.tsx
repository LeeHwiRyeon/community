import React from 'react';
import { Box, Container, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import AdminDashboard from '../components/Admin/AdminDashboard';

const AdminPage: React.FC = () => {
    const bgColor = useColorModeValue('gray.50', 'gray.900');

    return (
        <Box bg={bgColor} minH="100vh">
            <Container maxW="container.xl" py={8}>
                <VStack spacing={6} align="stretch">
                    <Box>
                        <Text fontSize="3xl" fontWeight="bold" mb={2}>
                            관리자 대시보드
                        </Text>
                        <Text color="gray.600" fontSize="lg">
                            커뮤니티 시스템 관리 및 모니터링
                        </Text>
                    </Box>

                    <AdminDashboard />
                </VStack>
            </Container>
        </Box>
    );
};

export default AdminPage;
