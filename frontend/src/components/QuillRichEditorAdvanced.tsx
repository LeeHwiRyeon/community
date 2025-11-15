import React, { useMemo, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import QuillBetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    TableChart as TableIcon,
    VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Quill 테이블 모듈 등록
Quill.register({
    'modules/better-table': QuillBetterTable
}, true);

// Quill 설정
const BlockEmbed = Quill.import('blots/block/embed');

// YouTube 임베드 블롯
class VideoBlot extends BlockEmbed {
    static blotName = 'video';
    static tagName = 'div';
    static className = 'ql-video-wrapper';

    static create(value: string) {
        const node = super.create() as HTMLElement;
        node.setAttribute('contenteditable', 'false');

        const iframe = document.createElement('iframe');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('src', this.sanitize(value));
        iframe.style.width = '100%';
        iframe.style.height = '400px';

        node.appendChild(iframe);
        return node;
    }

    static sanitize(url: string) {
        // YouTube URL 변환
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}`;
            }
        }
        return url;
    }

    static value(node: HTMLElement) {
        const iframe = node.querySelector('iframe');
        return iframe?.getAttribute('src') || '';
    }
}

Quill.register(VideoBlot);

// 코드 하이라이팅 설정
hljs.configure({
    languages: ['javascript', 'typescript', 'python', 'java', 'html', 'css', 'sql', 'bash']
});

// Quill 포맷 설정
const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align',
    'table',
];

interface QuillRichEditorAdvancedProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number | string;
    maxHeight?: number | string;
    showCharCount?: boolean;
    maxLength?: number;
    draftId?: number;
    onImageUpload?: (file: File) => Promise<string>;
}

const QuillRichEditorAdvanced: React.FC<QuillRichEditorAdvancedProps> = ({
    value,
    onChange,
    placeholder = '내용을 입력하세요...',
    readOnly = false,
    minHeight = 300,
    maxHeight = 600,
    showCharCount = true,
    maxLength,
    draftId,
    onImageUpload,
}) => {
    const quillRef = useRef<ReactQuill>(null);
    const [charCount, setCharCount] = useState(0);
    const [uploading, setUploading] = useState(false);

    // YouTube URL 입력 다이얼로그
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    // 링크 입력 다이얼로그
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    // 테이블 삽입 다이얼로그
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);    // 이미지 업로드 핸들러
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                setUploading(true);

                let imageUrl: string;

                if (onImageUpload) {
                    // 커스텀 업로드 함수 사용
                    imageUrl = await onImageUpload(file);
                } else if (draftId) {
                    // 기본 첨부파일 API 사용
                    const formData = new FormData();
                    formData.append('files', file);
                    formData.append('draftId', draftId.toString());

                    const response = await axios.post('/api/posts/drafts/attachments', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (response.data.success && response.data.attachments.length > 0) {
                        imageUrl = response.data.attachments[0].url;
                    } else {
                        throw new Error('이미지 업로드 실패');
                    }
                } else {
                    // Base64로 변환 (임시)
                    imageUrl = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                }

                // 에디터에 이미지 삽입
                const editor = quillRef.current?.getEditor();
                if (editor) {
                    const range = editor.getSelection(true);
                    editor.insertEmbed(range.index, 'image', imageUrl);
                    editor.setSelection(range.index + 1, 0);
                }
            } catch (error) {
                console.error('Image upload error:', error);
                alert('이미지 업로드 중 오류가 발생했습니다.');
            } finally {
                setUploading(false);
            }
        };
    }, [draftId, onImageUpload]);

    // 비디오 삽입 핸들러
    const handleVideoInsert = () => {
        if (!videoUrl) return;

        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'video', videoUrl);
            editor.setSelection(range.index + 1, 0);
        }

        setVideoUrl('');
        setVideoDialogOpen(false);
    };

    // 링크 삽입 핸들러
    const handleLinkInsert = () => {
        if (!linkUrl) return;

        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);

            if (linkText) {
                // 텍스트와 함께 링크 삽입
                editor.insertText(range.index, linkText, 'link', linkUrl);
                editor.setSelection(range.index + linkText.length, 0);
            } else {
                // 선택된 텍스트에 링크 적용
                editor.formatText(range.index, range.length, 'link', linkUrl);
            }
        }

        setLinkUrl('');
        setLinkText('');
        setLinkDialogOpen(false);
    };

    // 테이블 삽입 핸들러
    const handleTableInsert = () => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const tableModule = editor.getModule('better-table');
            if (tableModule) {
                tableModule.insertTable(tableRows, tableCols);
            }
        }

        setTableDialogOpen(false);
        setTableRows(3);
        setTableCols(3);
    };

    // 툴바 모듈 설정
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                // 헤더
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                // 텍스트 스타일
                ['bold', 'italic', 'underline', 'strike'],

                // 색상
                [{ 'color': [] }, { 'background': [] }],

                // 정렬
                [{ 'align': [] }],

                // 리스트
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],

                // 인용, 코드
                ['blockquote', 'code-block'],

                // 링크, 이미지, 비디오
                ['link', 'image', 'video'],

                // 초기화
                ['clean']
            ],
            handlers: {
                image: imageHandler,
                video: () => setVideoDialogOpen(true),
                link: () => setLinkDialogOpen(true),
            }
        },
        'better-table': {
            operationMenu: {
                items: {
                    unmergeCells: {
                        text: '셀 병합 해제'
                    }
                }
            }
        },
        clipboard: {
            matchVisual: false,
        },
        syntax: {
            highlight: (text: string) => hljs.highlightAuto(text).value
        }
    }), [imageHandler]);

    // 내용 변경 핸들러
    const handleChange = (content: string, delta: any, source: any, editor: any) => {
        const text = editor.getText();
        const length = text.length - 1;

        setCharCount(length);

        if (maxLength && length > maxLength) {
            return;
        }

        onChange(content);
    };

    return (
        <Box>
            {/* 커스텀 툴바 버튼 */}
            <Box display="flex" gap={1} mb={1}>
                <Tooltip title="테이블 삽입">
                    <IconButton
                        size="small"
                        onClick={() => setTableDialogOpen(true)}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                        <TableIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="YouTube 동영상 삽입">
                    <IconButton
                        size="small"
                        onClick={() => setVideoDialogOpen(true)}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                        <VideoIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper
                variant="outlined"
                sx={{
                    '& .ql-toolbar': {
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        bgcolor: 'background.default',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    },
                    '& .ql-container': {
                        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                        overflow: 'auto',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                    },
                    '& .ql-editor': {
                        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                        overflow: 'auto',
                    },
                    '& .ql-editor.ql-blank::before': {
                        color: 'text.secondary',
                        fontStyle: 'italic',
                    },
                    '& .ql-editor pre.ql-syntax': {
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '16px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    },
                    '& .ql-editor blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        paddingLeft: '16px',
                        marginLeft: 0,
                        fontStyle: 'italic',
                    },
                    '& .ql-video-wrapper': {
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        marginBottom: '16px',
                        '& iframe': {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }
                    },
                    '& .ql-editor img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                    },
                    '& .ql-editor table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '16px',
                    },
                    '& .ql-editor table td, & .ql-editor table th': {
                        border: '1px solid',
                        borderColor: 'divider',
                        padding: '8px',
                    },
                    '& .ql-editor table th': {
                        backgroundColor: 'action.hover',
                        fontWeight: 'bold',
                    }
                }}
            >
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    readOnly={readOnly || uploading}
                />
            </Paper>

            {/* 글자 수 표시 */}
            {showCharCount && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                        {charCount.toLocaleString()}자
                        {maxLength && ` / ${maxLength.toLocaleString()}자`}
                    </Typography>

                    {uploading && (
                        <Chip label="이미지 업로드 중..." size="small" color="info" />
                    )}

                    {maxLength && charCount > maxLength * 0.9 && !uploading && (
                        <Chip
                            label={`${maxLength - charCount}자 남음`}
                            size="small"
                            color={charCount >= maxLength ? 'error' : 'warning'}
                        />
                    )}
                </Box>
            )}

            {/* 최대 길이 경고 */}
            {maxLength && charCount >= maxLength && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    최대 글자 수({maxLength.toLocaleString()}자)에 도달했습니다.
                </Alert>
            )}

            {/* YouTube URL 입력 다이얼로그 */}
            <Dialog open={videoDialogOpen} onClose={() => setVideoDialogOpen(false)}>
                <DialogTitle>YouTube 동영상 삽입</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="YouTube URL"
                        type="url"
                        fullWidth
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        helperText="YouTube 동영상 링크를 입력하세요"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVideoDialogOpen(false)}>취소</Button>
                    <Button onClick={handleVideoInsert} variant="contained" disabled={!videoUrl}>
                        삽입
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 링크 입력 다이얼로그 */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
                <DialogTitle>링크 삽입</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="링크 텍스트"
                        type="text"
                        fullWidth
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        placeholder="링크로 표시할 텍스트 (선택사항)"
                        helperText="비워두면 선택된 텍스트에 링크가 적용됩니다"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="URL"
                        type="url"
                        fullWidth
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        helperText="링크 주소를 입력하세요"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>취소</Button>
                    <Button onClick={handleLinkInsert} variant="contained" disabled={!linkUrl}>
                        삽입
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 테이블 삽입 다이얼로그 */}
            <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)}>
                <DialogTitle>테이블 삽입</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="행 개수"
                            type="number"
                            value={tableRows}
                            onChange={(e) => setTableRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: 20 }}
                            fullWidth
                        />
                        <TextField
                            label="열 개수"
                            type="number"
                            value={tableCols}
                            onChange={(e) => setTableCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: 10 }}
                            fullWidth
                        />
                        <Typography variant="caption" color="text.secondary">
                            최대 20행 x 10열까지 생성할 수 있습니다.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTableDialogOpen(false)}>취소</Button>
                    <Button onClick={handleTableInsert} variant="contained">
                        삽입
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuillRichEditorAdvanced;
