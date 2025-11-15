import React from 'react';
import { Box, Typography, Container, Card, CardContent } from '@mui/material';

const Dashboard: React.FC = () => {
    return (
        <Container maxWidth="lg" data-testid="dashboard">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>📊 Dashboard</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
                    <Box sx={{ flex: '1 1 250px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>📈 Activity</Typography>
                                <Typography variant="h4" color="primary">42</Typography>
                                <Typography variant="body2" color="text.secondary">Posts this month</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>👥 Communities</Typography>
                                <Typography variant="h4" color="primary">8</Typography>
                                <Typography variant="body2" color="text.secondary">Joined communities</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>⭐ Reputation</Typography>
                                <Typography variant="h4" color="primary">1,250</Typography>
                                <Typography variant="body2" color="text.secondary">Community points</Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default Dashboard;