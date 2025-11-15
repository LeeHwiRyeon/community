import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Divider,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Grid,
    LinearProgress,
} from '@mui/material';
import {
    AutoAwesome as AutoIcon,
    Visibility as PreviewIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface PostMetadata {
    id?: number;
    post_id: number;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_url?: string;
    meta_keywords?: string;
    meta_description?: string;
    auto_generated?: number;
    created_at?: string;
    updated_at?: string;
}

interface PostMetadataEditorProps {
    postId: number;
    postTitle: string;
    postContent: string;
    onSave?: (metadata: PostMetadata) => void;
}

const PostMetadataEditor: React.FC<PostMetadataEditorProps> = ({
    postId,
    postTitle,
    postContent,
    onSave,
}) => {
    const [metadata, setMetadata] = useState<Partial<PostMetadata>>({
        og_title: '',
        og_description: '',
        og_image: '',
        og_url: '',
        meta_keywords: '',
        meta_description: '',
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load existing metadata
    useEffect(() => {
        if (postId) {
            loadMetadata();
        }
    }, [postId]);

    const loadMetadata = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/posts/${postId}/metadata`);

            if (response.data.success && response.data.metadata) {
                setMetadata(response.data.metadata);
            } else {
                // Initialize with post title
                setMetadata({
                    og_title: postTitle,
                    og_description: '',
                    og_image: '',
                    og_url: '',
                    meta_keywords: '',
                    meta_description: '',
                });
            }
        } catch (error) {
            console.error('Load metadata error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(`/api/posts/${postId}/metadata/auto-generate`);

            if (response.data.success) {
                setMetadata({
                    ...metadata,
                    ...response.data.metadata,
                });
                setSuccess('메타데이터가 자동으로 생성되었습니다.');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || '자동 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            const response = await axios.post(`/api/posts/${postId}/metadata`, metadata);

            if (response.data.success) {
                setSuccess('메타데이터가 저장되었습니다.');
                setMetadata(response.data.metadata);
                if (onSave) {
                    onSave(response.data.metadata);
                }
            }
        } catch (error: any) {
            setError(error.response?.data?.message || '저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('메타데이터를 삭제하시겠습니까?')) {
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const response = await axios.delete(`/api/posts/${postId}/metadata`);

            if (response.data.success) {
                setSuccess('메타데이터가 삭제되었습니다.');
                setMetadata({
                    og_title: postTitle,
                    og_description: '',
                    og_image: '',
                    og_url: '',
                    meta_keywords: '',
                    meta_description: '',
                });
            }
        } catch (error: any) {
            setError(error.response?.data?.message || '삭제 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof PostMetadata) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setMetadata({
            ...metadata,
            [field]: e.target.value,
        });
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    메타데이터를 불러오는 중...
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        SEO 메타데이터 관리
                        <Tooltip title="검색 엔진 최적화(SEO)와 소셜 미디어 공유를 위한 메타데이터를 설정합니다.">
                            <IconButton size="small" sx={{ ml: 1 }}>
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<AutoIcon />}
                            onClick={handleAutoGenerate}
                            disabled={loading || saving}
                        >
                            자동 생성
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            미리보기
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {metadata.auto_generated === 1 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <AutoIcon fontSize="small" />
                            <Typography variant="body2">
                                이 메타데이터는 자동으로 생성되었습니다. 필요시 수정할 수 있습니다.
                            </Typography>
                        </Box>
                    </Alert>
                )}

                <Divider sx={{ mb: 3 }} />

                {/* Open Graph Tags */}
                <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Open Graph 태그
                        <Chip label="소셜 미디어" size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Facebook, Twitter 등 소셜 미디어에서 공유될 때 표시되는 정보입니다.
                    </Typography>

                    <TextField
                        fullWidth
                        label="OG 제목"
                        value={metadata.og_title || ''}
                        onChange={handleChange('og_title')}
                        margin="normal"
                        placeholder={postTitle}
                        helperText="소셜 미디어에 표시될 제목 (비워두면 게시글 제목 사용)"
                    />

                    <TextField
                        fullWidth
                        label="OG 설명"
                        value={metadata.og_description || ''}
                        onChange={handleChange('og_description')}
                        margin="normal"
                        multiline
                        rows={2}
                        placeholder="게시글에 대한 간단한 설명..."
                        helperText={`${metadata.og_description?.length || 0}/160 글자 (권장: 150-160자)`}
                    />

                    <TextField
                        fullWidth
                        label="OG 이미지 URL"
                        value={metadata.og_image || ''}
                        onChange={handleChange('og_image')}
                        margin="normal"
                        placeholder="https://example.com/image.jpg"
                        helperText="소셜 미디어에 표시될 대표 이미지 URL (권장 크기: 1200x630px)"
                    />

                    <TextField
                        fullWidth
                        label="OG URL"
                        value={metadata.og_url || ''}
                        onChange={handleChange('og_url')}
                        margin="normal"
                        placeholder={`${window.location.origin}/posts/${postId}`}
                        helperText="게시글의 정식 URL (비워두면 자동으로 설정)"
                    />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* SEO Meta Tags */}
                <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        SEO 메타 태그
                        <Chip label="검색 엔진" size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        검색 엔진에서 더 잘 노출되도록 최적화된 정보입니다.
                    </Typography>

                    <TextField
                        fullWidth
                        label="메타 설명"
                        value={metadata.meta_description || ''}
                        onChange={handleChange('meta_description')}
                        margin="normal"
                        multiline
                        rows={2}
                        placeholder="검색 결과에 표시될 설명..."
                        helperText={`${metadata.meta_description?.length || 0}/160 글자 (권장: 150-160자)`}
                    />

                    <TextField
                        fullWidth
                        label="키워드"
                        value={metadata.meta_keywords || ''}
                        onChange={handleChange('meta_keywords')}
                        margin="normal"
                        placeholder="키워드1, 키워드2, 키워드3"
                        helperText="쉼표로 구분된 키워드 (5-10개 권장)"
                    />
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={2} mt={3}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '저장 중...' : '저장'}
                    </Button>
                    {metadata.id && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            삭제
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Preview */}
            {showPreview && (
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        미리보기
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {/* Social Media Preview */}
                        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        소셜 미디어 (Facebook, Twitter)
                                    </Typography>
                                    {metadata.og_image && (
                                        <Box
                                            component="img"
                                            src={metadata.og_image}
                                            alt="OG Preview"
                                            sx={{
                                                width: '100%',
                                                height: 200,
                                                objectFit: 'cover',
                                                borderRadius: 1,
                                                mb: 1,
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <Typography variant="h6" gutterBottom>
                                        {metadata.og_title || postTitle}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {metadata.og_description || '설명이 없습니다.'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        {metadata.og_url || window.location.href}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Search Engine Preview */}
                        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        검색 엔진 (Google, Naver)
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{ color: 'primary.main', cursor: 'pointer', mb: 0.5 }}
                                    >
                                        {metadata.og_title || postTitle}
                                    </Typography>
                                    <Typography variant="caption" color="success.main" display="block" mb={1}>
                                        {metadata.og_url || window.location.href}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {metadata.meta_description || metadata.og_description || '설명이 없습니다.'}
                                    </Typography>
                                    {metadata.meta_keywords && (
                                        <Box mt={1}>
                                            {metadata.meta_keywords.split(',').slice(0, 5).map((keyword, index) => (
                                                <Chip
                                                    key={index}
                                                    label={keyword.trim()}
                                                    size="small"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default PostMetadataEditor;
