import React from 'react'
import { Box, Text, Badge } from '@chakra-ui/react'

interface LiveIndicatorProps {
    isLive: boolean
    schedule?: string | null
    platform?: string
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
    isLive,
    schedule,
    platform
}) => {
    if (isLive) {
        return (
            <Badge colorScheme="red" variant="solid" fontSize="xs">
                🔴 LIVE
            </Badge>
        )
    }

    if (schedule) {
        const scheduleDate = new Date(schedule)
        const now = new Date()
        const isUpcoming = scheduleDate > now

        if (isUpcoming) {
            return (
                <Badge colorScheme="blue" variant="outline" fontSize="xs">
                    📅 예정: {scheduleDate.toLocaleString('ko-KR')}
                </Badge>
            )
        }
    }

    return (
        <Badge colorScheme="gray" variant="outline" fontSize="xs">
            오프라인
        </Badge>
    )
}