import React, { useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'

interface SpoilerToggleProps {
    children: React.ReactNode
    label?: string
}

export const SpoilerToggle: React.FC<SpoilerToggleProps> = ({
    children,
    label = '스포일러'
}) => {
    const [isRevealed, setIsRevealed] = useState(false)

    return (
        <Box>
            {!isRevealed ? (
                <Button
                    onClick={() => setIsRevealed(true)}
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                >
                    {label} 보기
                </Button>
            ) : (
                <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                        ⚠️ {label} 주의
                    </Text>
                    {children}
                </Box>
            )}
        </Box>
    )
}