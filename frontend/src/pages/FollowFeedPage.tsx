import React, { useState } from 'react';
import {
    Box,
    Container,
    Tabs,
    Tab,
    Paper,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { FiUsers, FiGrid } from 'react-icons/fi';
import FollowFeed from '../components/FollowFeed';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`follow-tabpanel-${index}`}
            aria-labelledby={`follow-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const FollowFeedPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <FiUsers size={32} />
                    팔로우 피드
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    팔로우한 사용자와 게시판의 최신 게시물을 확인하세요
                </Typography>
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="follow feed tabs"
                        variant={isMobile ? 'fullWidth' : 'standard'}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                minHeight: 60,
                                fontSize: '1rem',
                                fontWeight: 500
                            }
                        }}
                    >
                        <Tab
                            icon={<FiUsers size={20} />}
                            iconPosition="start"
                            label="사용자 피드"
                            id="follow-tab-0"
                            aria-controls="follow-tabpanel-0"
                        />
                        <Tab
                            icon={<FiGrid size={20} />}
                            iconPosition="start"
                            label="게시판 피드"
                            id="follow-tab-1"
                            aria-controls="follow-tabpanel-1"
                        />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <FollowFeed />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <FollowFeed />
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default FollowFeedPage;
