/**
 * 프로필 편집 모달
 * 사용자 프로필 정보 수정
 */

import React, { useState } from 'react';
import type { UserProfile, ProfileUpdateData } from '../../types/profile';
import './ProfileEditor.css';

interface ProfileEditorProps {
    profile: UserProfile;
    onSave: (updates: ProfileUpdateData) => Promise<void>;
    onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onCancel }) => {
    const [formData, setFormData] = useState<ProfileUpdateData>({
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        github_url: profile.github_url || '',
        twitter_url: profile.twitter_url || '',
        linkedin_url: profile.linkedin_url || '',
        theme_preference: profile.theme_preference || 'auto',
        show_email: profile.show_email,
        show_location: profile.show_location,
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateUrl = (url: string): boolean => {
        if (!url) return true; // 빈 값은 허용
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: Record<string, string> = {};

        if (formData.website && !validateUrl(formData.website)) {
            newErrors.website = '유효한 URL을 입력해주세요.';
        }
        if (formData.github_url && !validateUrl(formData.github_url)) {
            newErrors.github_url = '유효한 GitHub URL을 입력해주세요.';
        }
        if (formData.twitter_url && !validateUrl(formData.twitter_url)) {
            newErrors.twitter_url = '유효한 Twitter URL을 입력해주세요.';
        }
        if (formData.linkedin_url && !validateUrl(formData.linkedin_url)) {
            newErrors.linkedin_url = '유효한 LinkedIn URL을 입력해주세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);
            setErrors({});
            await onSave(formData);
        } catch (err: any) {
            setErrors({ submit: err.message || '저장에 실패했습니다.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof ProfileUpdateData, value: any) => {
        setFormData({ ...formData, [field]: value });
        // 에러 메시지 제거
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    return (
        <div className="profile-editor-overlay" onClick={onCancel}>
            <div className="profile-editor-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>프로필 편집</h2>
                    <button className="close-btn" onClick={onCancel}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="editor-form">
                    {/* 자기소개 */}
                    <div className="form-group">
                        <label htmlFor="bio">자기소개</label>
                        <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="자신에 대해 간단히 소개해주세요..."
                            rows={4}
                            maxLength={500}
                        />
                        <span className="char-count">{(formData.bio as string).length} / 500</span>
                    </div>

                    {/* 위치 */}
                    <div className="form-group">
                        <label htmlFor="location">위치</label>
                        <input
                            type="text"
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="예: 서울, 대한민국"
                            maxLength={100}
                        />
                    </div>

                    {/* 웹사이트 */}
                    <div className="form-group">
                        <label htmlFor="website">웹사이트</label>
                        <input
                            type="url"
                            id="website"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="https://example.com"
                        />
                        {errors.website && <span className="error-message">{errors.website}</span>}
                    </div>

                    {/* GitHub */}
                    <div className="form-group">
                        <label htmlFor="github_url">GitHub</label>
                        <input
                            type="url"
                            id="github_url"
                            value={formData.github_url}
                            onChange={(e) => handleChange('github_url', e.target.value)}
                            placeholder="https://github.com/username"
                        />
                        {errors.github_url && <span className="error-message">{errors.github_url}</span>}
                    </div>

                    {/* Twitter */}
                    <div className="form-group">
                        <label htmlFor="twitter_url">Twitter</label>
                        <input
                            type="url"
                            id="twitter_url"
                            value={formData.twitter_url}
                            onChange={(e) => handleChange('twitter_url', e.target.value)}
                            placeholder="https://twitter.com/username"
                        />
                        {errors.twitter_url && <span className="error-message">{errors.twitter_url}</span>}
                    </div>

                    {/* LinkedIn */}
                    <div className="form-group">
                        <label htmlFor="linkedin_url">LinkedIn</label>
                        <input
                            type="url"
                            id="linkedin_url"
                            value={formData.linkedin_url}
                            onChange={(e) => handleChange('linkedin_url', e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                        />
                        {errors.linkedin_url && <span className="error-message">{errors.linkedin_url}</span>}
                    </div>

                    {/* 테마 설정 */}
                    <div className="form-group">
                        <label htmlFor="theme_preference">테마</label>
                        <select
                            id="theme_preference"
                            value={formData.theme_preference}
                            onChange={(e) => handleChange('theme_preference', e.target.value)}
                        >
                            <option value="light">라이트 모드</option>
                            <option value="dark">다크 모드</option>
                            <option value="auto">자동 (시스템 설정)</option>
                        </select>
                    </div>

                    {/* 프라이버시 설정 */}
                    <div className="form-section">
                        <h3>프라이버시 설정</h3>

                        <div className="form-checkbox">
                            <input
                                type="checkbox"
                                id="show_email"
                                checked={formData.show_email}
                                onChange={(e) => handleChange('show_email', e.target.checked)}
                            />
                            <label htmlFor="show_email">이메일 주소 공개</label>
                        </div>

                        <div className="form-checkbox">
                            <input
                                type="checkbox"
                                id="show_location"
                                checked={formData.show_location}
                                onChange={(e) => handleChange('show_location', e.target.checked)}
                            />
                            <label htmlFor="show_location">위치 정보 공개</label>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="submit-error">{errors.submit}</div>
                    )}

                    {/* 버튼 */}
                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onCancel} disabled={saving}>
                            취소
                        </button>
                        <button type="submit" className="save-btn" disabled={saving}>
                            {saving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditor;
