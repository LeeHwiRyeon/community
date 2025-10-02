import React from 'react';
import { Box, Typography, Container, Card, CardContent } from '@mui/material';

const MonitoringDashboard: React.FC = () => {
    const metrics = [
        { name: 'Server Uptime', value: 99.9, unit: '%' },
        { name: 'Response Time', value: 120, unit: 'ms' },
        { name: 'Active Users', value: 1250, unit: 'users' },
        { name: 'Memory Usage', value: 68, unit: '%' }
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>📊 Monitoring Dashboard</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Real-time system monitoring and performance metrics
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {metrics.map((metric, index) => (
                        <Box key={index} sx={{ flex: '1 1 200px' }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>{metric.name}</Typography>
                                    <Typography variant="h4" color="primary.main">
                                        {metric.value.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">{metric.unit}</Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default MonitoringDashboard;