import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import './NewsList.css';

interface NewsListProps {
  data?: any[];
  onAction?: (action: string, item: any) => void;
  loading?: boolean;

}

const NewsList: React.FC<NewsListProps> = ({
  data = [],
  onAction,
  loading = false,

}) => {
  const handleAction = (action: string, item: any) => {
    onAction?.(action, item);
  };

  if (loading) {
    return (
      <Box className="newslist">
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box className="newslist">
      <Typography variant="h6" gutterBottom>
        NewsList
      </Typography>

      {data.length === 0 ? (
        <Box p={3} textAlign="center">
          <Typography color="text.secondary">
            데이터가 없습니다.
          </Typography>
        </Box>
      ) : (
        <Box>
          {data.map((item, index) => (
            <Box key={item.id || index} sx={{ mb: 2 }}>
              {/* 아이템 렌더링 */}
              <Typography variant="body1">
                {item.title || item.name || `Item ${index + 1}`}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NewsList;