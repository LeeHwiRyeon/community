import React from 'react';
import { Box, Typography, Container, Avatar, Card, CardContent } from '@mui/material';

const Profile: React.FC = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>U</Avatar>
                            <Box>
                                <Typography variant="h4" component="h1">👤 User Profile</Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Manage your profile information
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body1">Profile details will be displayed here.</Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Profile;