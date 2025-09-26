import React from 'react'
import { Box, Card, CardBody, Heading, Text, Button, VStack, HStack, Image, Link, Badge } from '@chakra-ui/react'
import { BroadcastPreview } from '../pages/post-helpers'
import { LiveIndicator } from './LiveIndicator'

interface BroadcastCardProps {
    preview: BroadcastPreview
    onClick?: () => void
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({
    preview,
    onClick
}) => {
    const { streamer, platform, streamUrl, scheduledFor, scheduleLabel, isLive, tags, thumbnail } = preview

    return (
        <Card
            cursor={onClick ? 'pointer' : 'default'}
            onClick={onClick}
            _hover={onClick ? { shadow: 'md' } : {}}
            transition="all 0.2s"
        >
            <CardBody>
                <VStack align="stretch" spacing={3}>
                    {thumbnail && (
                        <Image
                            src={thumbnail}
                            alt={`${streamer} 방송`}
                            borderRadius="md"
                            objectFit="cover"
                            maxH="200px"
                            w="100%"
                        />
                    )}

                    <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                                <Heading size="md" noOfLines={2}>
                                    {streamer}
                                </Heading>
                                <Text fontSize="sm" color="gray.600">
                                    {platform}
                                </Text>
                            </VStack>
                            <LiveIndicator isLive={isLive} schedule={scheduledFor} platform={platform} />
                        </HStack>

                        {scheduleLabel && (
                            <Text fontSize="sm" color="blue.600" fontWeight="medium">
                                {scheduleLabel}
                            </Text>
                        )}

                        {tags && tags.length > 0 && (
                            <HStack spacing={2} wrap="wrap">
                                {tags.map((tag, index) => (
                                    <Badge key={index} colorScheme="purple" variant="subtle" fontSize="xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </HStack>
                        )}

                        <Button
                            as={Link}
                            href={streamUrl}
                            isExternal
                            colorScheme={isLive ? 'red' : 'blue'}
                            size="sm"
                            w="100%"
                        >
                            {isLive ? '라이브 시청하기' : '방송 보러가기'}
                        </Button>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    )
}