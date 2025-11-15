// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { profileService } from '../services/profileService';
import { UserProfile, ProfileUpdateData } from '../types/profile';

const EditProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Image previews
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const currentUserId = Number(localStorage.getItem('userId'));
  const isOwnProfile = currentUserId === Number(userId);

  useEffect(() => {
    if (!isOwnProfile) {
      navigate(`/profile/${userId}`);
      return;
    }

    if (userId) {
      loadProfile();
    }
  }, [userId, isOwnProfile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(Number(userId));
      setProfile(data);

      // Populate form
      setDisplayName(data.username || '');
      setBio(data.bio || '');
      setLocation(data.location || '');
      setWebsite(data.website || '');
      setTwitterHandle(data.twitter_url || '');
      setGithubUsername(data.github_url || '');
      setLinkedinUrl(data.linkedin_url || '');
      setInterests([]);
      setIsPublic(data.show_email);
      setProfileImagePreview(data.avatar_url || null);
      setCoverImagePreview(data.banner_image || null);
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
        return;
      }

      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      if (interests.length >= 10) {
        setError('관심사는 최대 10개까지 추가할 수 있습니다.');
        return;
      }
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleDeleteInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Upload images first if changed
      if (profileImageFile) {
        await profileService.uploadProfileImage(Number(userId), profileImageFile);
      }

      if (coverImageFile) {
        await profileService.uploadCoverImage(Number(userId), coverImageFile);
      }

      // Update profile data
      const updateData: ProfileUpdateData = {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        twitterHandle: twitterHandle.trim() || undefined,
        githubUsername: githubUsername.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined,
        isProfilePublic: isPublic
      };

      await profileService.updateProfile(Number(userId), updateData);

      setSuccess('프로필이 성공적으로 업데이트되었습니다.');

      // Redirect to profile page after 1.5 seconds
      setTimeout(() => {
        navigate(`/profile/${userId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">프로필을 찾을 수 없습니다.</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              프로필 편집
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Cover Image */}
          <Box mb={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              커버 이미지
            </Typography>
            <Box
              sx={{
                height: 200,
                bgcolor: coverImagePreview ? 'transparent' : '#e0e0e0',
                backgroundImage: coverImagePreview ? `url(${coverImagePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverImageChange}
              />
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={() => coverImageInputRef.current?.click()}
              >
                커버 이미지 변경
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              권장 크기: 1200x250px, 최대 5MB
            </Typography>
          </Box>

          {/* Profile Image */}
          <Box mb={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              프로필 이미지
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={profileImagePreview || undefined}
                sx={{ width: 100, height: 100 }}
              />
              <Box>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleProfileImageChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<CameraIcon />}
                  onClick={() => profileImageInputRef.current?.click()}
                >
                  이미지 변경
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  정사각형 이미지 권장, 최대 5MB
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Basic Info */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="표시 이름"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                helperText="프로필에 표시될 이름"
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="자기소개"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                helperText={`${bio.length}/500`}
                inputProps={{ maxLength: 500 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위치"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 서울, 대한민국"
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="웹사이트"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                inputProps={{ maxLength: 255 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                소셜 링크
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Twitter"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="username"
                helperText="@ 없이 입력"
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="GitHub"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="username"
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="LinkedIn"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                inputProps={{ maxLength: 255 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                관심사
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                  placeholder="관심사 입력 후 Enter"
                  inputProps={{ maxLength: 30 }}
                />
                <Button variant="outlined" onClick={handleAddInterest}>
                  추가
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {interests.map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest}
                    onDelete={() => handleDeleteInterest(interest)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                최대 10개까지 추가 가능
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                }
                label="프로필 공개"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                비공개로 설정하면 본인만 프로필을 볼 수 있습니다.
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EditProfilePage;
