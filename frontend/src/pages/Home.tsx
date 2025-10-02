import React from 'react';
import { Box, Typography, Container, Card, CardContent, Button } from '@mui/material';

const Home: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h2" component="h1" gutterBottom align="center">
                    🏠 Community Hub Home
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
                    Welcome to TheNewsPaper Community Platform
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 4, justifyContent: 'center' }}>
                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="h3" gutterBottom>
                                    📰 Latest News
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Stay updated with the latest community news and announcements.
                                </Typography>
                                <Button variant="contained" sx={{ mt: 2 }}>
                                    Read More
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="h3" gutterBottom>
                                    👥 Communities
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Join various communities and connect with like-minded people.
                                </Typography>
                                <Button variant="contained" sx={{ mt: 2 }}>
                                    Explore
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="h3" gutterBottom>
                                    💬 Discussions
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Participate in engaging discussions and share your thoughts.
                                </Typography>
                                <Button variant="contained" sx={{ mt: 2 }}>
                                    Join Discussion
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default Home;