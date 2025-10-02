import React, { useState } from 'react';
import { Button, VStack, Text, HStack } from '@chakra-ui/react';

interface VoteButtonProps {
    targetType: 'post' | 'comment';
    targetId: string;
    initialVotes?: { up: number; down: number };
    userVote?: 'up' | 'down' | null;
}

const VoteButton: React.FC<VoteButtonProps> = ({
    targetType,
    targetId,
    initialVotes = { up: 0, down: 0 },
    userVote = null,
}) => {
    const [votes, setVotes] = useState(initialVotes);
    const [currentVote, setCurrentVote] = useState(userVote);

    const handleVote = async (voteType: 'up' | 'down') => {
        const isCancelling = currentVote === voteType;
        const newVote = isCancelling ? null : voteType;

        // Optimistic update
        setCurrentVote(newVote);
        setVotes(prev => {
            const delta = isCancelling ? -1 : (currentVote ? 0 : 1);
            return {
                ...prev,
                [voteType]: prev[voteType] + delta,
                ...(currentVote && currentVote !== voteType ? { [currentVote]: prev[currentVote] - 1 } : {}),
            };
        });

        try {
            if (isCancelling) {
                await fetch(`/api/${targetType}s/${targetId}/vote`, { method: 'DELETE' });
            } else {
                await fetch(`/api/${targetType}s/${targetId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ voteType }),
                });
            }
        } catch (error) {
            // Revert on error
            setCurrentVote(currentVote);
            setVotes(initialVotes);
            console.error('Vote failed:', error);
        }
    };

    return (
        <VStack spacing={1}>
            <Button
                size="sm"
                variant={currentVote === 'up' ? 'solid' : 'outline'}
                colorScheme={currentVote === 'up' ? 'green' : 'gray'}
                onClick={() => handleVote('up')}
            >
                ▲
            </Button>
            <Text fontSize="sm" fontWeight="bold">
                {votes.up - votes.down}
            </Text>
            <Button
                size="sm"
                variant={currentVote === 'down' ? 'solid' : 'outline'}
                colorScheme={currentVote === 'down' ? 'red' : 'gray'}
                onClick={() => handleVote('down')}
            >
                ▼
            </Button>
        </VStack>
    );
};

export default VoteButton;