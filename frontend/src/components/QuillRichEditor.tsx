import React, { useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
    Box,
    Paper,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    Alert,
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    Code,
    FormatListBulleted,
    FormatListNumbered,
    Link as LinkIcon,
} from '@mui/icons-material';

// Quill 포맷 설정
const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align',
];

interface QuillRichEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number | string;
    maxHeight?: number | string;
    showCharCount?: boolean;
    maxLength?: number;
}

const QuillRichEditor: React.FC<QuillRichEditorProps> = ({
    value,
    onChange,
    placeholder = '내용을 입력하세요...',
    readOnly = false,
    minHeight = 300,
    maxHeight = 600,
    showCharCount = true,
    maxLength,
}) => {
    const quillRef = useRef<ReactQuill>(null);
    const [charCount, setCharCount] = useState(0);

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

                // 링크, 이미지
                ['link', 'image'],

                // 초기화
                ['clean']
            ],
        },
        clipboard: {
            matchVisual: false, // 붙여넣기 시 스타일 유지
        },
    }), []);

    // 내용 변경 핸들러
    const handleChange = (content: string, delta: any, source: any, editor: any) => {
        const text = editor.getText();
        const length = text.length - 1; // Quill은 마지막에 \n을 추가하므로 -1

        setCharCount(length);

        // 최대 길이 체크
        if (maxLength && length > maxLength) {
            return; // 최대 길이 초과 시 변경 취소
        }

        onChange(content);
    };

    // 텍스트 추출 (순수 텍스트만)
    const getPlainText = (): string => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            return editor.getText();
        }
        return '';
    };

    // HTML 추출
    const getHTML = (): string => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            return editor.root.innerHTML;
        }
        return '';
    };

    return (
        <Box>
            <Paper
                variant="outlined"
                sx={{
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
                    '& .ql-toolbar': {
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        bgcolor: 'background.default',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    },
                    '& .ql-editor.ql-blank::before': {
                        color: 'text.secondary',
                        fontStyle: 'italic',
                    },
                    '& .ql-editor pre.ql-syntax': {
                        backgroundColor: '#23241f',
                        color: '#f8f8f2',
                        padding: '16px',
                        borderRadius: '4px',
                        overflow: 'auto',
                    },
                    '& .ql-editor blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        paddingLeft: '16px',
                        marginLeft: 0,
                        fontStyle: 'italic',
                    },
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
                    readOnly={readOnly}
                />
            </Paper>

            {/* 글자 수 표시 */}
            {showCharCount && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                        {charCount.toLocaleString()}자
                        {maxLength && ` / ${maxLength.toLocaleString()}자`}
                    </Typography>

                    {maxLength && charCount > maxLength * 0.9 && (
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
        </Box>
    );
};

export default QuillRichEditor;
