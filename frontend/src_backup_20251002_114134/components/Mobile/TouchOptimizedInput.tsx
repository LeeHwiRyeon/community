// 터치 최적화된 입력 컴포넌트
import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

interface TouchOptimizedInputProps extends InputProps {
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  hapticFeedback?: boolean;
  minTouchSize?: number;
  autoFocusOnMount?: boolean;
}

const TouchOptimizedInput: React.FC<TouchOptimizedInputProps> = ({
  onTouchStart,
  onTouchEnd,
  hapticFeedback = true,
  minTouchSize = 44,
  autoFocusOnMount = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 마운트 시 자동 포커스
  useEffect(() => {
    if (autoFocusOnMount && inputRef.current) {
      // 모바일에서는 포커스 시 키보드가 올라오므로 약간의 지연
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocusOnMount]);

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    
    // 햅틱 피드백
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
    
    onTouchStart?.();
  };

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
    onTouchEnd?.();
  };

  // 포커스 이벤트
  const handleFocus = (e: React.FocusEvent) => {
    setIsFocused(true);
    
    // 모바일에서 포커스 시 스크롤 방지
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // 터치 영역 확보를 위한 스타일
  const touchStyles = {
    minHeight: `${minTouchSize}px`,
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    fontSize: '16px', // iOS 줌 방지
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    transition: 'transform 0.1s ease-in-out',
    borderWidth: isFocused ? '2px' : '1px',
    borderColor: isFocused ? 'blue.400' : 'gray.300',
  };

  return (
    <Input
      ref={inputRef}
      {...props}
      style={{
        ...touchStyles,
        ...props.style,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      _focus={{
        borderColor: 'blue.400',
        boxShadow: '0 0 0 1px #3182ce',
        transform: 'scale(1.02)',
        ...props._focus,
      }}
      _active={{
        transform: 'scale(0.98)',
        ...props._active,
      }}
    />
  );
};

export default TouchOptimizedInput;
