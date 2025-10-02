import React from 'react';
import { Checkbox, VStack, Text, Wrap, WrapItem } from '@chakra-ui/react';

interface TagFilterProps {
    availableTags: string[];
    selectedTags: string[];
    onChange: (selected: string[]) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ availableTags, selectedTags, onChange }) => {
    const handleTagChange = (tag: string, checked: boolean) => {
        if (checked) {
            onChange([...selectedTags, tag]);
        } else {
            onChange(selectedTags.filter(t => t !== tag));
        }
    };

    return (
        <VStack align="start" spacing={2}>
            <Text fontWeight="bold">태그 필터</Text>
            <Wrap>
                {availableTags.map(tag => (
                    <WrapItem key={tag}>
                        <Checkbox
                            isChecked={selectedTags.includes(tag)}
                            onChange={(e) => handleTagChange(tag, e.target.checked)}
                        >
                            {tag}
                        </Checkbox>
                    </WrapItem>
                ))}
            </Wrap>
        </VStack>
    );
};

export default TagFilter;