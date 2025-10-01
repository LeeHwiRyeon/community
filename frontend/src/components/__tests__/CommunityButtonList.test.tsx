import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import CommunityButtonList from '../CommunityButtonList';

// Mock communities data
const mockCommunities = [
    {
        id: 'gaming',
        title: 'Gaming Community',
        description: 'Discuss your favorite games',
        boards: []
    },
    {
        id: 'cosplay',
        title: 'Cosplay Community',
        description: 'Showcase your cosplay creations',
        boards: []
    },
    {
        id: 'broadcast',
        title: 'Broadcast Community',
        description: 'Live streaming content',
        boards: []
    }
];

const renderWithChakra = (component: React.ReactElement) => {
    return render(
        <ChakraProvider>
            {component}
        </ChakraProvider>
    );
};

describe('CommunityButtonList', () => {
    const defaultProps = {
        communities: mockCommunities,
        selectedCommunityId: null,
        onCommunitySelect: vi.fn(),
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render community buttons', () => {
            renderWithChakra(<CommunityButtonList {...defaultProps} />);

            expect(screen.getByText('Gaming Community')).toBeInTheDocument();
            expect(screen.getByText('Cosplay Community')).toBeInTheDocument();
            expect(screen.getByText('Broadcast Community')).toBeInTheDocument();
        });

        it('should show loading state when isLoading is true', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} isLoading={true} />
            );

            expect(screen.getByText('Loading communities...')).toBeInTheDocument();
        });

        it('should show no communities message when empty', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} communities={[]} />
            );

            expect(screen.getByText('No communities available')).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onCommunitySelect when button is clicked', () => {
            const onCommunitySelect = vi.fn();
            renderWithChakra(
                <CommunityButtonList {...defaultProps} onCommunitySelect={onCommunitySelect} />
            );

            fireEvent.click(screen.getByText('Gaming Community'));
            expect(onCommunitySelect).toHaveBeenCalledWith('gaming');
        });

        it('should highlight selected community', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} selectedCommunityId="gaming" />
            );

            const gamingButtons = screen.getAllByText('Gaming Community');
            const buttonElement = gamingButtons.find(el => el.tagName === 'BUTTON');
            expect(buttonElement).toHaveClass('selected');
        });

        it('should show selected community info', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} selectedCommunityId="gaming" />
            );

            expect(screen.getByText(/Selected:/)).toBeInTheDocument();
            expect(screen.getAllByText('Gaming Community')).toHaveLength(2); // Button and selected text
            expect(screen.getByText('Discuss your favorite games')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            renderWithChakra(<CommunityButtonList {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(3);
        });

        it('should be keyboard navigable', () => {
            renderWithChakra(<CommunityButtonList {...defaultProps} />);

            const firstButton = screen.getByText('Gaming Community');
            firstButton.focus();
            expect(firstButton).toHaveFocus();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined communities', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} communities={undefined as any} />
            );

            expect(screen.getByText('No communities available')).toBeInTheDocument();
        });

        it('should handle null selectedCommunityId', () => {
            renderWithChakra(
                <CommunityButtonList {...defaultProps} selectedCommunityId={null} />
            );

            expect(screen.queryByText('Selected:')).not.toBeInTheDocument();
        });
    });
});
