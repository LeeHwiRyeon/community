import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageLayoutProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    description,
    breadcrumbs,
    children
}) => {
    const navigate = useNavigate();

    const handleBreadcrumbClick = (href: string) => {
        navigate(href);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* 브레드크럼 */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumbs sx={{ mb: 3 }}>
                        {breadcrumbs.map((item, index) => (
                            <Link
                                key={index}
                                color="inherit"
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.href) {
                                        handleBreadcrumbClick(item.href);
                                    }
                                }}
                                sx={{ textDecoration: 'none' }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </Breadcrumbs>
                )}

                {/* 페이지 제목 */}
                <Typography variant="h4" component="h1" gutterBottom>
                    {title}
                </Typography>

                {/* 페이지 설명 */}
                {description && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {description}
                    </Typography>
                )}

                {/* 페이지 컨텐츠 */}
                {children}
            </Container>
        </Box>
    );
};

export default PageLayout;
