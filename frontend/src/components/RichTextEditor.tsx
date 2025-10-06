import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Toolbar,
    IconButton,
    Button,
    Typography,
    Divider,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    FormatUnderlined as UnderlineIcon,
    FormatListBulleted as BulletListIcon,
    FormatListNumbered as NumberedListIcon,
    Link as LinkIcon,
    Image as ImageIcon,
    Code as CodeIcon,
    TableChart as TableIcon,
    Save as SaveIcon,
    Preview as PreviewIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignRight as AlignRightIcon,
    FormatColorText as TextColorIcon,
    FormatSize as FontSizeIcon,
    InsertDriveFile as FileIcon,
    YouTube as YouTubeIcon,
    Twitter as TwitterIcon
} from '@mui/icons-material';

interface RichTextEditorProps {
    initialContent?: string;
    onSave?: (content: string) => void;
    onPreview?: (content: string) => void;
    placeholder?: string;
    maxLength?: number;
    autoSave?: boolean;
    autoSaveInterval?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialContent = '',
    onSave,
    onPreview,
    placeholder = '내용을 입력하세요...',
    maxLength = 10000,
    autoSave = true,
    autoSaveInterval = 30000
}) => {
    const [content, setContent] = useState(initialContent);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [showTableDialog, setShowTableDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [fontSize, setFontSize] = useState('16');
    const [textColor, setTextColor] = useState('#000000');

    const editorRef = useRef<HTMLDivElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 자동 저장 설정
    React.useEffect(() => {
        if (autoSave && content !== initialContent) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
                handleSave();
            }, autoSaveInterval);
        }
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [content, autoSave, autoSaveInterval, initialContent]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (onSave) {
                await onSave(content);
            }
            setLastSaved(new Date());
        } catch (error) {
            console.error('저장 실패:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreview = () => {
        if (onPreview) {
            onPreview(content);
        }
        setIsPreviewMode(!isPreviewMode);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const insertLink = () => {
        if (linkUrl && linkText) {
            const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            execCommand('insertHTML', linkHtml);
            setShowLinkDialog(false);
            setLinkUrl('');
            setLinkText('');
        }
    };

    const insertImage = () => {
        if (imageUrl) {
            const imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto;" />`;
            execCommand('insertHTML', imageHtml);
            setShowImageDialog(false);
            setImageUrl('');
            setImageAlt('');
        }
    };

    const insertTable = () => {
        let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        for (let i = 0; i < tableRows; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < tableCols; j++) {
                tableHtml += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        execCommand('insertHTML', tableHtml);
        setShowTableDialog(false);
    };

    const insertCodeBlock = () => {
        const codeHtml = '<pre><code>코드를 입력하세요...</code></pre>';
        execCommand('insertHTML', codeHtml);
    };

    const insertYouTube = () => {
        const youtubeUrl = prompt('YouTube URL을 입력하세요:');
        if (youtubeUrl) {
            const videoId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            if (videoId) {
                const embedHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
                execCommand('insertHTML', embedHtml);
            }
        }
    };

    const handleContentChange = () => {
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
    };

    const getCharacterCount = () => {
        const textContent = editorRef.current?.textContent || '';
        return textContent.length;
    };

    const isOverLimit = getCharacterCount() > maxLength;

    return (
        <Box sx={{ width: '100%' }}>
            {/* 툴바 */}
            <Paper elevation={1} sx={{ mb: 2 }}>
                <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {/* 텍스트 서식 */}
                    <IconButton onClick={() => execCommand('bold')} title="굵게">
                        <BoldIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('italic')} title="기울임">
                        <ItalicIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('underline')} title="밑줄">
                        <UnderlineIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 정렬 */}
                    <IconButton onClick={() => execCommand('justifyLeft')} title="왼쪽 정렬">
                        <AlignLeftIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('justifyCenter')} title="가운데 정렬">
                        <AlignCenterIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('justifyRight')} title="오른쪽 정렬">
                        <AlignRightIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 목록 */}
                    <IconButton onClick={() => execCommand('insertUnorderedList')} title="불릿 목록">
                        <BulletListIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('insertOrderedList')} title="번호 목록">
                        <NumberedListIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 링크 및 미디어 */}
                    <IconButton onClick={() => setShowLinkDialog(true)} title="링크 삽입">
                        <LinkIcon />
                    </IconButton>
                    <IconButton onClick={() => setShowImageDialog(true)} title="이미지 삽입">
                        <ImageIcon />
                    </IconButton>
                    <IconButton onClick={insertYouTube} title="YouTube 삽입">
                        <YouTubeIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 코드 및 테이블 */}
                    <IconButton onClick={insertCodeBlock} title="코드 블록">
                        <CodeIcon />
                    </IconButton>
                    <IconButton onClick={() => setShowTableDialog(true)} title="테이블 삽입">
                        <TableIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 실행 취소/다시 실행 */}
                    <IconButton onClick={() => execCommand('undo')} title="실행 취소">
                        <UndoIcon />
                    </IconButton>
                    <IconButton onClick={() => execCommand('redo')} title="다시 실행">
                        <RedoIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    {/* 액션 버튼 */}
                    <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="outlined"
                        size="small"
                    >
                        {isSaving ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                        startIcon={<PreviewIcon />}
                        onClick={handlePreview}
                        variant="outlined"
                        size="small"
                    >
                        {isPreviewMode ? '편집' : '미리보기'}
                    </Button>
                </Toolbar>
            </Paper>

            {/* 에디터 영역 */}
            <Paper elevation={1} sx={{ minHeight: 400 }}>
                <Box
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    dangerouslySetInnerHTML={{ __html: content }}
                    sx={{
                        p: 2,
                        minHeight: 400,
                        outline: 'none',
                        '&:focus': {
                            outline: 'none'
                        },
                        '& p': {
                            margin: '8px 0'
                        },
                        '& ul, & ol': {
                            margin: '8px 0',
                            paddingLeft: '24px'
                        },
                        '& img': {
                            maxWidth: '100%',
                            height: 'auto'
                        },
                        '& table': {
                            borderCollapse: 'collapse',
                            width: '100%',
                            margin: '8px 0'
                        },
                        '& td, & th': {
                            border: '1px solid #ccc',
                            padding: '8px'
                        },
                        '& pre': {
                            backgroundColor: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '4px',
                            overflow: 'auto'
                        },
                        '& code': {
                            backgroundColor: '#f5f5f5',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            fontFamily: 'monospace'
                        }
                    }}
                    style={{
                        ...(isOverLimit && { border: '2px solid #f44336' })
                    }}
                />
            </Paper>

            {/* 상태 바 */}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color={isOverLimit ? 'error' : 'text.secondary'}>
                        {getCharacterCount()} / {maxLength} 글자
                    </Typography>
                    {lastSaved && (
                        <Typography variant="body2" color="text.secondary">
                            마지막 저장: {lastSaved.toLocaleTimeString()}
                        </Typography>
                    )}
                </Box>
                {isSaving && (
                    <Box sx={{ width: 200 }}>
                        <LinearProgress />
                    </Box>
                )}
            </Box>

            {isOverLimit && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    글자 수 제한을 초과했습니다. ({getCharacterCount() - maxLength}글자 초과)
                </Alert>
            )}

            {/* 링크 삽입 다이얼로그 */}
            <Dialog open={showLinkDialog} onClose={() => setShowLinkDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>링크 삽입</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="링크 텍스트"
                        fullWidth
                        variant="outlined"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="URL"
                        fullWidth
                        variant="outlined"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowLinkDialog(false)}>취소</Button>
                    <Button onClick={insertLink} variant="contained">삽입</Button>
                </DialogActions>
            </Dialog>

            {/* 이미지 삽입 다이얼로그 */}
            <Dialog open={showImageDialog} onClose={() => setShowImageDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>이미지 삽입</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="이미지 URL"
                        fullWidth
                        variant="outlined"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        sx={{ mb: 2 }}
                        placeholder="https://example.com/image.jpg"
                    />
                    <TextField
                        margin="dense"
                        label="대체 텍스트"
                        fullWidth
                        variant="outlined"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        placeholder="이미지 설명"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowImageDialog(false)}>취소</Button>
                    <Button onClick={insertImage} variant="contained">삽입</Button>
                </DialogActions>
            </Dialog>

            {/* 테이블 삽입 다이얼로그 */}
            <Dialog open={showTableDialog} onClose={() => setShowTableDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>테이블 삽입</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                            label="행 수"
                            type="number"
                            value={tableRows}
                            onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <TextField
                            label="열 수"
                            type="number"
                            value={tableCols}
                            onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 10 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTableDialog(false)}>취소</Button>
                    <Button onClick={insertTable} variant="contained">삽입</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RichTextEditor;
