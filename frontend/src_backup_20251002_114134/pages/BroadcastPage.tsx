import React from 'react'
import { Box, Container, Heading, Text, SimpleGrid, VStack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../api'
import { BroadcastCard } from '../components/BroadcastCard'
import { BroadcastPreview, asBroadcastPreview } from './post-helpers'

export const BroadcastPage: React.FC = () => {
    const { data: posts, isLoading, error } = useQuery({
        queryKey: ['broadcasts'],
        queryFn: () => apiService.getPosts('broadcast'),
        staleTime: 1000 * 60 * 5 // 5분
    })

    if (isLoading) {
        return (
            <Container maxW="container.xl" py={8}>
                <VStack spacing={6}>
                    <Heading size="lg">Live Broadcasts</Heading>
                    <Text>Loading broadcasts...</Text>
                </VStack>
            </Container>
        )
    }

    if (error) {
        return (
            <Container maxW="container.xl" py={8}>
                <VStack spacing={6}>
                    <Heading size="lg">Live Broadcasts</Heading>
                    <Text color="red.500">Failed to load broadcasts</Text>
                </VStack>
            </Container>
        )
    }

    const broadcastPosts = posts?.filter(post => post.preview?.type === 'broadcast') || []
    const broadcastPreviews = broadcastPosts
        .map(post => asBroadcastPreview(post.preview))
        .filter((preview): preview is BroadcastPreview => preview !== undefined)

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={6} align="stretch">
                <Box>
                    <Heading size="lg" mb={2}>Live Broadcasts</Heading>
                    <Text color="gray.600">
                        Watch strategy breakdowns, ranked grinds, and event co-streams from community creators.
                    </Text>
                </Box>

                {broadcastPreviews.length === 0 ? (
                    <Box textAlign="center" py={12}>
                        <Text fontSize="lg" color="gray.500">
                            No broadcasts available at the moment.
                        </Text>
                    </Box>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {broadcastPreviews.map((preview, index) => (
                            <BroadcastCard
                                key={index}
                                preview={preview}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </VStack>
        </Container>
    )
}