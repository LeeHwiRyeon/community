import React from 'react';
import { Box, Typography, Container, Card, CardContent, Button, Chip } from '@mui/material';

const UserTestingDashboard: React.FC = () => {
    const tests = [
        { id: 1, name: 'Navigation UX Test', description: 'Test the new navigation system', status: 'Active', participants: 45 },
        { id: 2, name: 'Mobile Responsiveness', description: 'Test mobile interface improvements', status: 'Completed', participants: 32 },
        { id: 3, name: 'VIP Features Beta', description: 'Beta test new VIP features', status: 'Recruiting', participants: 12 }
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>🧪 User Testing Dashboard</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Participate in user testing and help improve the platform
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {tests.map((test) => (
                        <Box key={test.id} sx={{ flex: '1 1 300px' }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6">{test.name}</Typography>
                                        <Chip
                                            label={test.status}
                                            color={test.status === 'Active' ? 'primary' : test.status === 'Completed' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {test.description}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        👥 {test.participants} participants
                                    </Typography>
                                    <Button variant="contained" fullWidth disabled={test.status === 'Completed'}>
                                        {test.status === 'Completed' ? 'Completed' : 'Join Test'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default UserTestingDashboard;