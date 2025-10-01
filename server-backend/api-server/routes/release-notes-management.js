const express = require('express');
const { v4: uuidv4 } = require('uuid');
const marked = require('marked');
const DOMPurify = require('isomorphic-dompurify');
const router = express.Router();

// 릴리즈 노트 관리 시스템 클래스
class ReleaseNotesManagementSystem {
    constructor() {
        this.notes = new Map();
        this.templates = new Map();
        this.translations = new Map();
        this.versions = new Map();
        this.noteIdCounter = 1;
        this.initializeTemplates();
        this.initializeTranslations();
    }

    // 템플릿 초기화
    initializeTemplates() {
        const templates = [
            {
                id: 'standard',
                name: 'Standard Release Notes',
                description: '기본 릴리즈 노트 템플릿',
                content: `# {{version}} Release Notes

## 🎉 New Features
- 

## 🐛 Bug Fixes
- 

## 🔧 Improvements
- 

## ⚠️ Breaking Changes
- 

## 📚 Documentation
- 

## 🔄 Migration Guide
- 

## 📊 Performance
- 

## 🛡️ Security
- 

## 🙏 Acknowledgments
- 

---
*Released on {{releaseDate}}*`
            },
            {
                id: 'minimal',
                name: 'Minimal Release Notes',
                description: '간소화된 릴리즈 노트 템플릿',
                content: `# {{version}}

## What's New
- 

## Bug Fixes
- 

---
*{{releaseDate}}*`
            },
            {
                id: 'detailed',
                name: 'Detailed Release Notes',
                description: '상세한 릴리즈 노트 템플릿',
                content: `# {{version}} Release Notes

## 📋 Overview
{{overview}}

## 🎯 Key Highlights
- 

## ✨ New Features
### Major Features
- 

### Minor Features
- 

## 🐛 Bug Fixes
### Critical Fixes
- 

### General Fixes
- 

## 🔧 Improvements
### Performance Improvements
- 

### UI/UX Improvements
- 

### Developer Experience
- 

## ⚠️ Breaking Changes
- 

## 🔄 Migration Guide
### Before
\`\`\`
// Old code
\`\`\`

### After
\`\`\`
// New code
\`\`\`

## 📚 Documentation Updates
- 

## 📊 Performance Metrics
- Response time: {{responseTime}}
- Memory usage: {{memoryUsage}}
- CPU usage: {{cpuUsage}}

## 🛡️ Security Updates
- 

## 🔧 System Requirements
- Minimum OS: {{minOS}}
- Minimum RAM: {{minRAM}}
- Minimum Storage: {{minStorage}}

## 📦 Installation
\`\`\`bash
# Installation command
\`\`\`

## 🚀 Upgrade Instructions
1. 
2. 
3. 

## 🐛 Known Issues
- 

## 🔮 What's Next
- 

## 🙏 Acknowledgments
- 

## 📞 Support
- Documentation: {{docsUrl}}
- Support: {{supportUrl}}
- Community: {{communityUrl}}

---
*Released on {{releaseDate}} by {{author}}*`
            }
        ];

        templates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }

    // 번역 초기화
    initializeTranslations() {
        const translations = {
            'en': {
                'new_features': 'New Features',
                'bug_fixes': 'Bug Fixes',
                'improvements': 'Improvements',
                'breaking_changes': 'Breaking Changes',
                'documentation': 'Documentation',
                'migration_guide': 'Migration Guide',
                'performance': 'Performance',
                'security': 'Security',
                'acknowledgments': 'Acknowledgments',
                'released_on': 'Released on'
            },
            'ko': {
                'new_features': '새로운 기능',
                'bug_fixes': '버그 수정',
                'improvements': '개선사항',
                'breaking_changes': '주요 변경사항',
                'documentation': '문서화',
                'migration_guide': '마이그레이션 가이드',
                'performance': '성능',
                'security': '보안',
                'acknowledgments': '감사의 말',
                'released_on': '릴리즈 날짜'
            },
            'ja': {
                'new_features': '新機能',
                'bug_fixes': 'バグ修正',
                'improvements': '改善',
                'breaking_changes': '破壊的変更',
                'documentation': 'ドキュメント',
                'migration_guide': '移行ガイド',
                'performance': 'パフォーマンス',
                'security': 'セキュリティ',
                'acknowledgments': '謝辞',
                'released_on': 'リリース日'
            }
        };

        this.translations.set('translations', translations);
    }

    // 릴리즈 노트 생성
    createReleaseNote(noteData) {
        const noteId = `note_${this.noteIdCounter++}`;
        const note = {
            id: noteId,
            version: noteData.version,
            title: noteData.title || `${noteData.version} Release Notes`,
            content: noteData.content || '',
            template: noteData.template || 'standard',
            language: noteData.language || 'en',
            status: 'draft', // 'draft', 'review', 'published', 'archived'
            author: noteData.author,
            reviewer: noteData.reviewer || null,
            tags: noteData.tags || [],
            category: noteData.category || 'release',
            priority: noteData.priority || 'medium',
            isPublic: noteData.isPublic !== false,
            publishDate: noteData.publishDate || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
            metadata: {
                wordCount: 0,
                readingTime: 0,
                lastModified: new Date(),
                version: 1
            },
            translations: new Map(),
            attachments: [],
            comments: []
        };

        // 템플릿 적용
        if (noteData.template) {
            note.content = this.applyTemplate(noteData.template, noteData);
        }

        // 메타데이터 계산
        this.calculateMetadata(note);

        this.notes.set(noteId, note);
        return note;
    }

    // 템플릿 적용
    applyTemplate(templateId, data) {
        const template = this.templates.get(templateId);
        if (!template) return data.content || '';

        let content = template.content;

        // 변수 치환
        const variables = {
            version: data.version || '1.0.0',
            releaseDate: data.releaseDate || new Date().toLocaleDateString(),
            author: data.author || 'Unknown',
            overview: data.overview || '',
            responseTime: data.responseTime || 'N/A',
            memoryUsage: data.memoryUsage || 'N/A',
            cpuUsage: data.cpuUsage || 'N/A',
            minOS: data.minOS || 'N/A',
            minRAM: data.minRAM || 'N/A',
            minStorage: data.minStorage || 'N/A',
            docsUrl: data.docsUrl || '#',
            supportUrl: data.supportUrl || '#',
            communityUrl: data.communityUrl || '#'
        };

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, variables[key]);
        });

        return content;
    }

    // 메타데이터 계산
    calculateMetadata(note) {
        const wordCount = note.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

        note.metadata.wordCount = wordCount;
        note.metadata.readingTime = readingTime;
        note.metadata.lastModified = new Date();
    }

    // 마크다운 렌더링
    renderMarkdown(content, options = {}) {
        const renderer = new marked.Renderer();

        // 커스텀 렌더러 설정
        renderer.heading = (text, level) => {
            const id = text.toLowerCase().replace(/[^\w]+/g, '-');
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        renderer.link = (href, title, text) => {
            const target = href.startsWith('http') ? 'target="_blank" rel="noopener"' : '';
            return `<a href="${href}" title="${title || ''}" ${target}>${text}</a>`;
        };

        renderer.code = (code, language) => {
            const validLanguage = language || 'text';
            return `<pre><code class="language-${validLanguage}">${code}</code></pre>`;
        };

        const markedOptions = {
            renderer: renderer,
            gfm: true,
            breaks: true,
            sanitize: false,
            ...options
        };

        const html = marked(content, markedOptions);
        return DOMPurify.sanitize(html);
    }

    // 미리보기 생성
    generatePreview(noteId) {
        const note = this.notes.get(noteId);
        if (!note) return null;

        const html = this.renderMarkdown(note.content);
        const css = this.generatePreviewCSS();

        return {
            html,
            css,
            metadata: note.metadata,
            version: note.version,
            title: note.title
        };
    }

    // 미리보기 CSS 생성
    generatePreviewCSS() {
        return `
        <style>
            .release-notes {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .release-notes h1 {
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            .release-notes h2 {
                color: #34495e;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .release-notes h3 {
                color: #7f8c8d;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            .release-notes ul, .release-notes ol {
                margin: 10px 0;
                padding-left: 20px;
            }
            .release-notes li {
                margin: 5px 0;
            }
            .release-notes code {
                background: #f8f9fa;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            }
            .release-notes pre {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                border-left: 4px solid #3498db;
            }
            .release-notes blockquote {
                border-left: 4px solid #e74c3c;
                margin: 20px 0;
                padding: 10px 20px;
                background: #f8f9fa;
            }
            .release-notes table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .release-notes th, .release-notes td {
                border: 1px solid #ddd;
                padding: 8px 12px;
                text-align: left;
            }
            .release-notes th {
                background: #f8f9fa;
                font-weight: bold;
            }
            .release-notes .emoji {
                font-size: 1.2em;
            }
        </style>
        `;
    }

    // 다국어 번역
    translateNote(noteId, targetLanguage) {
        const note = this.notes.get(noteId);
        if (!note) return null;

        const translations = this.translations.get('translations');
        if (!translations[targetLanguage]) return null;

        const translation = {
            id: `${noteId}_${targetLanguage}`,
            originalId: noteId,
            language: targetLanguage,
            content: this.translateContent(note.content, targetLanguage),
            title: this.translateTitle(note.title, targetLanguage),
            status: 'translated',
            translatedAt: new Date(),
            translator: 'auto', // 실제로는 번역자 정보
            quality: this.calculateTranslationQuality(note.content, targetLanguage)
        };

        note.translations.set(targetLanguage, translation);
        return translation;
    }

    // 콘텐츠 번역
    translateContent(content, targetLanguage) {
        // 실제로는 번역 API 사용
        const translations = this.translations.get('translations');
        const lang = translations[targetLanguage];

        if (!lang) return content;

        let translatedContent = content;

        // 기본 키워드 번역
        Object.keys(lang).forEach(key => {
            const regex = new RegExp(key.replace('_', ' '), 'gi');
            translatedContent = translatedContent.replace(regex, lang[key]);
        });

        return translatedContent;
    }

    // 제목 번역
    translateTitle(title, targetLanguage) {
        // 실제로는 제목 번역 로직
        return title;
    }

    // 번역 품질 계산
    calculateTranslationQuality(content, targetLanguage) {
        // 실제로는 번역 품질 평가
        return Math.random() * 100;
    }

    // 릴리즈 노트 검색
    searchNotes(query, filters = {}) {
        let notes = Array.from(this.notes.values());

        // 텍스트 검색
        if (query) {
            const searchTerm = query.toLowerCase();
            notes = notes.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                note.version.toLowerCase().includes(searchTerm) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 필터 적용
        if (filters.status) {
            notes = notes.filter(note => note.status === filters.status);
        }

        if (filters.language) {
            notes = notes.filter(note => note.language === filters.language);
        }

        if (filters.category) {
            notes = notes.filter(note => note.category === filters.category);
        }

        if (filters.author) {
            notes = notes.filter(note => note.author === filters.author);
        }

        if (filters.dateFrom) {
            notes = notes.filter(note => note.createdAt >= new Date(filters.dateFrom));
        }

        if (filters.dateTo) {
            notes = notes.filter(note => note.createdAt <= new Date(filters.dateTo));
        }

        return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 릴리즈 노트 통계
    getNotesStats() {
        const notes = Array.from(this.notes.values());

        const stats = {
            total: notes.length,
            byStatus: {},
            byLanguage: {},
            byCategory: {},
            byAuthor: {},
            recent: notes.slice(0, 10),
            popular: notes
                .sort((a, b) => b.metadata.wordCount - a.metadata.wordCount)
                .slice(0, 10)
        };

        // 상태별 통계
        notes.forEach(note => {
            stats.byStatus[note.status] = (stats.byStatus[note.status] || 0) + 1;
            stats.byLanguage[note.language] = (stats.byLanguage[note.language] || 0) + 1;
            stats.byCategory[note.category] = (stats.byCategory[note.category] || 0) + 1;
            stats.byAuthor[note.author] = (stats.byAuthor[note.author] || 0) + 1;
        });

        return stats;
    }

    // 템플릿 관리
    getTemplates() {
        return Array.from(this.templates.values());
    }

    createTemplate(templateData) {
        const template = {
            id: templateData.id || uuidv4(),
            name: templateData.name,
            description: templateData.description,
            content: templateData.content,
            variables: templateData.variables || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: templateData.createdBy
        };

        this.templates.set(template.id, template);
        return template;
    }

    // 버전 관리
    createVersion(noteId, versionData) {
        const note = this.notes.get(noteId);
        if (!note) return null;

        const version = {
            id: uuidv4(),
            noteId,
            version: versionData.version,
            content: versionData.content,
            changes: versionData.changes || [],
            createdAt: new Date(),
            createdBy: versionData.createdBy
        };

        note.metadata.version++;
        this.versions.set(version.id, version);
        return version;
    }
}

// 전역 릴리즈 노트 관리 시스템 인스턴스
const notesSystem = new ReleaseNotesManagementSystem();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 릴리즈 노트 생성
router.post('/notes', authenticateUser, async (req, res) => {
    try {
        const note = notesSystem.createReleaseNote(req.body);

        res.status(201).json({
            success: true,
            message: '릴리즈 노트가 생성되었습니다.',
            data: note
        });
    } catch (error) {
        console.error('릴리즈 노트 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '릴리즈 노트 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 릴리즈 노트 목록 조회
router.get('/notes', async (req, res) => {
    try {
        const { query, status, language, category, author, dateFrom, dateTo } = req.query;
        const notes = notesSystem.searchNotes(query, {
            status, language, category, author, dateFrom, dateTo
        });

        res.json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error('릴리즈 노트 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '릴리즈 노트 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 릴리즈 노트 상세 조회
router.get('/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const note = notesSystem.notes.get(id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: '릴리즈 노트를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('릴리즈 노트 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '릴리즈 노트 상세 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 미리보기 생성
router.get('/notes/:id/preview', async (req, res) => {
    try {
        const { id } = req.params;
        const preview = notesSystem.generatePreview(id);

        if (!preview) {
            return res.status(404).json({
                success: false,
                message: '릴리즈 노트를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: preview
        });
    } catch (error) {
        console.error('미리보기 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '미리보기 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 번역 생성
router.post('/notes/:id/translate', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { targetLanguage } = req.body;

        const translation = notesSystem.translateNote(id, targetLanguage);

        if (!translation) {
            return res.status(404).json({
                success: false,
                message: '릴리즈 노트를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '번역이 생성되었습니다.',
            data: translation
        });
    } catch (error) {
        console.error('번역 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '번역 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 템플릿 목록 조회
router.get('/templates', async (req, res) => {
    try {
        const templates = notesSystem.getTemplates();

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('템플릿 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '템플릿 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 통계 조회
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const stats = notesSystem.getNotesStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
