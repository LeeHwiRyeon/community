/**
 * 블록체인 NFT 시스템 (v1.3)
 * 디지털 자산의 생성, 거래, 관리 시스템
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AccountBalanceWallet,
  Add,
  Sell,
  TrendingUp,
  Visibility,
  Share,
  Favorite,
  FavoriteBorder,
  Download,
  Upload,
  Refresh,
  Settings,
  Security,
  MonetizationOn,
  Image,
  VideoLibrary,
  MusicNote,
  Code,
  Palette
} from '@mui/icons-material';

// NFT 데이터 타입
interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  owner: string;
  creator: string;
  attributes: NFTAttribute[];
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  views: number;
  isLiked: boolean;
  category: string;
  status: 'active' | 'sold' | 'auction' | 'draft';
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

const BlockchainNFTSystem: React.FC = () => {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState('all');

  // NFT 목록 로드
  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 모의 데이터
      const mockNFTs: NFTItem[] = [
        {
          id: '1',
          name: 'Digital Art #001',
          description: 'AI 생성 디지털 아트워크',
          image: '/api/placeholder/300/300',
          price: 0.5,
          currency: 'ETH',
          owner: '0x1234...5678',
          creator: '0xabcd...efgh',
          attributes: [
            { trait_type: 'Color', value: 'Blue' },
            { trait_type: 'Style', value: 'Abstract' },
            { trait_type: 'Rarity', value: 'Rare' }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          likes: 42,
          views: 156,
          isLiked: false,
          category: 'art',
          status: 'active'
        }
      ];
      setNfts(mockNFTs);
    } catch (error) {
      console.error('NFT 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNFT = () => {
    setShowCreateDialog(true);
  };

  const handleLikeNFT = (nftId: string) => {
    setNfts(prev => prev.map(nft => 
      nft.id === nftId 
        ? { 
            ...nft, 
            isLiked: !nft.isLiked,
            likes: nft.isLiked ? nft.likes - 1 : nft.likes + 1
          }
        : nft
    ));
  };

  const filteredNFTs = nfts.filter(nft => {
    if (filter === 'all') return true;
    return nft.category === filter;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🎨 블록체인 NFT 시스템
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        디지털 자산의 생성, 거래, 관리를 제공하는 NFT 마켓플레이스
      </Typography>

      {/* 액션 버튼들 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNFT}
          sx={{ borderRadius: 2 }}
        >
          NFT 생성
        </Button>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="카테고리"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="art">아트</MenuItem>
            <MenuItem value="music">음악</MenuItem>
            <MenuItem value="video">비디오</MenuItem>
            <MenuItem value="code">코드</MenuItem>
          </Select>
        </FormControl>

        <IconButton onClick={loadNFTs} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* NFT 그리드 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredNFTs.map((nft) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={nft.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box
                  component="img"
                  src={nft.image}
                  alt={nft.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {nft.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {nft.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">
                      {nft.price} {nft.currency}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      label={nft.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={nft.status}
                      size="small"
                      color={nft.status === 'active' ? 'success' : 'default'}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleLikeNFT(nft.id)}
                        color={nft.isLiked ? 'error' : 'default'}
                      >
                        {nft.isLiked ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                      <Typography variant="body2">{nft.likes}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility fontSize="small" />
                      <Typography variant="body2">{nft.views}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* NFT 생성 다이얼로그 */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>새 NFT 생성</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="NFT 이름"
              margin="normal"
            />
            <TextField
              fullWidth
              label="설명"
              multiline
              rows={3}
              margin="normal"
            />
            <TextField
              fullWidth
              label="가격 (ETH)"
              type="number"
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>카테고리</InputLabel>
              <Select label="카테고리">
                <MenuItem value="art">아트</MenuItem>
                <MenuItem value="music">음악</MenuItem>
                <MenuItem value="video">비디오</MenuItem>
                <MenuItem value="code">코드</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>
            취소
          </Button>
          <Button variant="contained" onClick={() => setShowCreateDialog(false)}>
            생성
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlockchainNFTSystem;