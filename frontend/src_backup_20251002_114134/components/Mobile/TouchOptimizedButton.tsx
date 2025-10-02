// 터치 최적화된 버튼 컴포넌트
import React, { useState, useRef, useEffect } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

interface TouchOptimizedButtonProps extends ButtonProps {
  children: React.ReactNode;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  hapticFeedback?: boolean;
  minTouchSize?: number;
}

const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onTouchStart,
  onTouchEnd,
  hapticFeedback = true,
  minTouchSize = 44, // 최소 44px (iOS 가이드라인)
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartTime(Date.now());
    setIsPressed(true);
    
    // 햅틱 피드백 (지원하는 경우)
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // 짧은 진동
    }
    
    onTouchStart?.();
  };

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = touchStartTime ? Date.now() - touchStartTime : 0;
    setIsPressed(false);
    setTouchStartTime(null);
    
    // 터치 시간이 너무 짧으면 클릭으로 처리하지 않음 (실수 터치 방지)
    if (touchDuration < 100) {
      e.preventDefault();
      return;
    }
    
    onTouchEnd?.();
  };

  // 터치 취소
  const handleTouchCancel = () => {
    setIsPressed(false);
    setTouchStartTime(null);
  };

  // 마우스 이벤트 (데스크톱에서도 동작)
  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // 터치 영역 확보를 위한 스타일
  const touchStyles = {
    minHeight: `${minTouchSize}px`,
    minWidth: `${minTouchSize}px`,
    touchAction: 'manipulation', // 더블 탭 줌 방지
    userSelect: 'none', // 텍스트 선택 방지
    WebkitTapHighlightColor: 'transparent', // iOS 탭 하이라이트 제거
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.1s ease-in-out',
    position: 'relative' as const,
  };

  // 터치 영역 확장을 위한 가상 영역
  const virtualTouchArea = {
    position: 'absolute' as const,
    top: '-10px',
    left: '-10px',
    right: '-10px',
    bottom: '-10px',
    zIndex: 1,
  };

  return (
    <Button
      ref={buttonRef}
      {...props}
      style={{
        ...touchStyles,
        ...props.style,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      _active={{
        transform: 'scale(0.95)',
        ...props._active,
      }}
      _hover={{
        transform: 'scale(1.02)',
        ...props._hover,
      }}
    >
      {children}
      {/* 터치 영역 확장을 위한 가상 영역 */}
      <div style={virtualTouchArea} />
    </Button>
  );
};

export default TouchOptimizedButton;
