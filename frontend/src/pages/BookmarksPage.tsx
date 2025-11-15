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
import { FiBookmark, FiFolder } from 'react-icons/fi';
import BookmarkList from '../components/BookmarkList';
import BookmarkFolderManager from '../components/BookmarkFolderManager';

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
            id={`bookmark-tabpanel-${index}`}
            aria-labelledby={`bookmark-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const BookmarksPage: React.FC = () => {
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
                    <FiBookmark size={32} />
                    북마크
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    저장한 게시물을 관리하고 폴더로 정리하세요
                </Typography>
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="bookmark tabs"
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
                            icon={<FiBookmark size={20} />}
                            iconPosition="start"
                            label="내 북마크"
                            id="bookmark-tab-0"
                            aria-controls="bookmark-tabpanel-0"
                        />
                        <Tab
                            icon={<FiFolder size={20} />}
                            iconPosition="start"
                            label="폴더 관리"
                            id="bookmark-tab-1"
                            aria-controls="bookmark-tabpanel-1"
                        />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <BookmarkList />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <BookmarkFolderManager />
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default BookmarksPage;
