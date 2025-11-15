import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    SvgIconProps,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
    icon?: React.ReactElement<SvgIconProps>;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    height?: string | number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = <InboxIcon />,
    title,
    description,
    action,
    height = 400,
}) => {
    return (
        <Card
            sx={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <CardContent
                sx={{
                    textAlign: 'center',
                    maxWidth: 400,
                    p: 4,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                    }}
                >
                    {React.cloneElement(icon, {
                        sx: {
                            fontSize: 80,
                            color: 'text.secondary',
                            opacity: 0.5,
                        },
                    })}
                </Box>

                <Typography
                    variant="h6"
                    color="text.primary"
                    gutterBottom
                    fontWeight="medium"
                >
                    {title}
                </Typography>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        {description}
                    </Typography>
                )}

                {action && (
                    <Button
                        variant="contained"
                        onClick={action.onClick}
                        sx={{ mt: 2 }}
                    >
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default EmptyState;
