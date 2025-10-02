import React from 'react';
import { Tag, Wrap, WrapItem, Text } from '@chakra-ui/react';

interface TagCloudProps {
    tags: { name: string; count: number }[];
    onTagClick?: (tag: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ tags, onTagClick }) => {
    const maxCount = Math.max(...tags.map(t => t.count), 1);

    return (
        <Wrap spacing={2}>
            <Text fontWeight="bold" mr={2}>인기 태그:</Text>
            {tags.map(({ name, count }) => {
                const size = Math.max(0.8, (count / maxCount) * 1.5); // relative size
                return (
                    <WrapItem key={name}>
                        <Tag
                            size="md"
                            variant="outline"
                            cursor={onTagClick ? 'pointer' : 'default'}
                            fontSize={`${size}rem`}
                            onClick={() => onTagClick?.(name)}
                        >
                            {name} ({count})
                        </Tag>
                    </WrapItem>
                );
            })}
        </Wrap>
    );
};

export default TagCloud;