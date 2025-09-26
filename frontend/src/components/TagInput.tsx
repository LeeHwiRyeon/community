import React, { useState } from 'react';
import { Input, Tag, VStack, HStack, Wrap, WrapItem, TagCloseButton } from '@chakra-ui/react';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = '태그 입력...' }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <VStack align="start" spacing={2}>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                onBlur={addTag}
            />
            <Wrap>
                {tags.map((tag, index) => (
                    <WrapItem key={index}>
                        <Tag size="md" variant="solid" colorScheme="blue">
                            {tag}
                            <TagCloseButton onClick={() => removeTag(tag)} />
                        </Tag>
                    </WrapItem>
                ))}
            </Wrap>
        </VStack>
    );
};

export default TagInput;