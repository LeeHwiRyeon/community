import React from 'react';
import { Box, Link } from '@chakra-ui/react';

interface SkipLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
    return (
        <Link
            href={href}
            className={className}
            position="absolute"
            top="-40px"
            left="6px"
            background="blue.500"
            color="white"
            padding="8px 16px"
            borderRadius="4px"
            textDecoration="none"
            zIndex="1000"
            fontSize="14px"
            fontWeight="bold"
            _focus={{
                top: "6px",
                transition: "top 0.2s ease-in-out",
            }}
            _hover={{
                background: "blue.600",
                textDecoration: "none",
            }}
            onFocus={(e) => {
                e.currentTarget.style.top = '6px';
            }}
            onBlur={(e) => {
                e.currentTarget.style.top = '-40px';
            }}
        >
            {children}
        </Link>
    );
};

export default SkipLink;
