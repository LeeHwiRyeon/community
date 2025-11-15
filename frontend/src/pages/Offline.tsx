import { Box, Heading, Text, Button, VStack, Icon, Container } from '@chakra-ui/react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const OfflinePage = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        if (isOnline) {
            window.location.reload();
        }
    };

    return (
        <Container maxW="container.md" h="100vh">
            <VStack spacing={8} justify="center" h="100%" textAlign="center">
                {/* 오프라인 아이콘 */}
                <Box
                    p={8}
                    bg="gray.100"
                    borderRadius="full"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon as={FiWifiOff} boxSize={20} color="gray.500" />
                </Box>

                {/* 제목 */}
                <Heading size="xl" color="gray.700">
                    {isOnline ? '연결 복구됨' : '오프라인 상태'}
                </Heading>

                {/* 설명 */}
                <Text fontSize="lg" color="gray.600" maxW="md">
                    {isOnline
                        ? '인터넷 연결이 복구되었습니다. 페이지를 새로고침하세요.'
                        : '현재 인터넷에 연결되어 있지 않습니다. 연결을 확인해주세요.'}
                </Text>

                {/* 네트워크 상태 표시 */}
                <Box
                    px={4}
                    py={2}
                    bg={isOnline ? 'green.100' : 'red.100'}
                    borderRadius="md"
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                >
                    <Box
                        w={3}
                        h={3}
                        bg={isOnline ? 'green.500' : 'red.500'}
                        borderRadius="full"
                        animation={isOnline ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}
                    />
                    <Text fontSize="sm" fontWeight="medium" color={isOnline ? 'green.700' : 'red.700'}>
                        {isOnline ? '온라인' : '오프라인'}
                    </Text>
                </Box>

                {/* 재시도 버튼 */}
                <Button
                    leftIcon={<Icon as={FiRefreshCw} />}
                    colorScheme="blue"
                    size="lg"
                    onClick={handleRetry}
                    isDisabled={!isOnline}
                >
                    페이지 새로고침
                </Button>

                {/* 캐시된 콘텐츠 안내 */}
                <Box mt={8} p={4} bg="blue.50" borderRadius="md" maxW="lg">
                    <Text fontSize="sm" color="blue.700">
                        💡 <strong>안내:</strong> 일부 페이지는 오프라인에서도 이용 가능합니다.
                        이전에 방문한 페이지는 캐시에서 불러올 수 있습니다.
                    </Text>
                </Box>
            </VStack>

            <style>
                {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
            </style>
        </Container>
    );
};

export default OfflinePage;
