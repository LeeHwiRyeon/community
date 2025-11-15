/**
 * MentionHighlight Component
 * 텍스트 내의 @username을 하이라이팅하여 표시
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './MentionHighlight.css';

interface MentionHighlightProps {
    text: string;
    className?: string;
}

/**
 * @username 패턴을 찾아서 링크로 변환
 */
const MentionHighlight: React.FC<MentionHighlightProps> = ({ text, className = '' }) => {
    if (!text) return null;

    // @username 패턴 (영문, 숫자, 언더스코어, 3-20자)
    const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;

    // 멘션이 없으면 그대로 반환
    if (!mentionRegex.test(text)) {
        return <span className={className}>{text}</span>;
    }

    // 텍스트를 멘션과 일반 텍스트로 분리
    const parts: Array<{ type: 'text' | 'mention'; content: string }> = [];
    let lastIndex = 0;

    // regex를 재실행하기 위해 다시 생성
    const regex = /@([a-zA-Z0-9_]{3,20})/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // 멘션 이전의 텍스트 추가
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }

        // 멘션 추가
        parts.push({
            type: 'mention',
            content: match[1] // @를 제외한 username만
        });

        lastIndex = match.index + match[0].length;
    }

    // 마지막 텍스트 추가
    if (lastIndex < text.length) {
        parts.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.type === 'mention') {
                    return (
                        <Link
                            key={index}
                            to={`/profile/${part.content}`}
                            className="mention-link"
                            onClick={(e) => e.stopPropagation()} // 부모 요소 클릭 이벤트 방지
                        >
                            @{part.content}
                        </Link>
                    );
                } else {
                    return <span key={index}>{part.content}</span>;
                }
            })}
        </span>
    );
};

export default MentionHighlight;
