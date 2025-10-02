import React from 'react';
import { Box, Button, Text, VStack, HStack, useColorModeValue, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';

/**
 * Community Platform v1.1 - 접근성 도우미 컴포넌트
 * 
 * 웹 접근성(WCAG 2.1 AA 준수)을 위한 유틸리티 컴포넌트들을 제공합니다.
 * 스크린 리더, 키보드 네비게이션, 색상 대비 등을 지원합니다.
 */

// 🔍 스크린 리더 전용 텍스트
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return (
    <Box
      position="absolute"
      width="1px"
      height="1px"
      padding="0"
      margin="-1px"
      overflow="hidden"
      clip="rect(0, 0, 0, 0)"
      whiteSpace="nowrap"
      border="0"
    >
      {children}
    </Box>
  );
};

// ⏭️ 스킵 링크 컴포넌트
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <Box
      as="a"
      href={href}
      position="absolute"
      top="-40px"
      left="6px"
      bg="blue.500"
      color="white"
      padding="8px"
      textDecoration="none"
      borderRadius="4px"
      zIndex="9999"
      _focus={{
        top: "6px"
      }}
    >
      {children}
    </Box>
  );
};

// 🎯 포커스 관리 훅
export const useFocusManagement = () => {
  const focusElementById = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  };

  const focusFirstFocusableElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    focusElementById,
    focusFirstFocusableElement,
    trapFocus
  };
};

// 📢 라이브 리전 컴포넌트 (스크린 리더 알림)
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false
}) => {
  return (
    <Box
      aria-live={politeness}
      aria-atomic={atomic}
      role="status"
    >
      {children}
    </Box>
  );
};

// ⌨️ 키보드 네비게이션 도우미
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  onArrowKeys
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowKeys?.('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowKeys?.('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowKeys?.('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowKeys?.('right');
        break;
    }
  };

  return (
    <Box onKeyDown={handleKeyDown} tabIndex={0}>
      {children}
    </Box>
  );
};

// 🎨 고대비 모드 감지 훅
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
};

// 🔊 음성 안내 훅
export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // 기존 메시지 클리어
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  };

  const AnnouncementRegion = () => (
    <LiveRegion politeness="polite">
      {announcement && (
        <ScreenReaderOnly>
          {announcement}
        </ScreenReaderOnly>
      )}
    </LiveRegion>
  );

  return { announce, AnnouncementRegion };
};

// 📏 텍스트 크기 조절 컴포넌트
export const FontSizeController: React.FC = () => {
  const [fontSize, setFontSize] = React.useState(16);

  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const resetFontSize = () => {
    setFontSize(16);
  };

  return (
    <HStack spacing={2}>
      <Button
        size="sm"
        onClick={decreaseFontSize}
        aria-label="글자 크기 줄이기"
        disabled={fontSize <= 12}
      >
        A-
      </Button>
      <Text fontSize="sm" minW="60px" textAlign="center">
        {fontSize}px
      </Text>
      <Button
        size="sm"
        onClick={increaseFontSize}
        aria-label="글자 크기 늘리기"
        disabled={fontSize >= 24}
      >
        A+
      </Button>
      <Button
        size="sm"
        onClick={resetFontSize}
        aria-label="글자 크기 초기화"
      >
        초기화
      </Button>
    </HStack>
  );
};

// 🎯 포커스 표시기 컴포넌트
interface FocusIndicatorProps {
  children: React.ReactNode;
  color?: string;
  width?: string;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  color = 'blue.500',
  width = '2px'
}) => {
  return (
    <Box
      _focusWithin={{
        outline: `${width} solid`,
        outlineColor: color,
        outlineOffset: '2px'
      }}
    >
      {children}
    </Box>
  );
};

// 🚨 접근성 경고 컴포넌트
interface AccessibilityAlertProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  onClose?: () => void;
}

export const AccessibilityAlert: React.FC<AccessibilityAlertProps> = ({
  type,
  title,
  description,
  onClose
}) => {
  const getStatus = () => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <Alert status={getStatus()} borderRadius="md" mb={4}>
      <AlertIcon />
      <Box>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Box>
      {onClose && (
        <Button
          size="sm"
          variant="ghost"
          ml="auto"
          onClick={onClose}
          aria-label="알림 닫기"
        >
          ✕
        </Button>
      )}
    </Alert>
  );
};

// 🔍 접근성 검사 도구
export const AccessibilityChecker: React.FC = () => {
  const [issues, setIssues] = React.useState<string[]>([]);
  const [isChecking, setIsChecking] = React.useState(false);

  const checkAccessibility = async () => {
    setIsChecking(true);
    const foundIssues: string[] = [];

    // 이미지 alt 텍스트 검사
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      foundIssues.push(`${images.length}개의 이미지에 alt 텍스트가 없습니다.`);
    }

    // 제목 구조 검사
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > prevLevel + 1) {
        foundIssues.push('제목 구조가 올바르지 않습니다. (건너뛴 레벨 발견)');
      }
      prevLevel = level;
    });

    // 링크 텍스트 검사
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      const text = link.textContent?.trim();
      if (!text || text.length < 3) {
        foundIssues.push('의미 있는 텍스트가 없는 링크가 발견되었습니다.');
      }
    });

    // 폼 라벨 검사
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!id && !ariaLabel && !ariaLabelledby) {
        foundIssues.push('라벨이 없는 입력 필드가 발견되었습니다.');
      }
    });

    setTimeout(() => {
      setIssues(foundIssues);
      setIsChecking(false);
    }, 1000);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Button
        onClick={checkAccessibility}
        isLoading={isChecking}
        loadingText="검사 중..."
        colorScheme="blue"
      >
        접근성 검사 실행
      </Button>

      {issues.length > 0 && (
        <VStack spacing={2} align="stretch">
          <Text fontWeight="bold" color="red.500">
            발견된 접근성 문제 ({issues.length}개)
          </Text>
          {issues.map((issue, index) => (
            <AccessibilityAlert
              key={index}
              type="warning"
              title={`문제 ${index + 1}`}
              description={issue}
            />
          ))}
        </VStack>
      )}

      {!isChecking && issues.length === 0 && (
        <AccessibilityAlert
          type="info"
          title="검사 완료"
          description="접근성 문제가 발견되지 않았습니다."
        />
      )}
    </VStack>
  );
};

// 📱 모바일 접근성 도우미
export const MobileAccessibilityHelper: React.FC = () => {
  const [touchTargetSize, setTouchTargetSize] = React.useState(44);

  React.useEffect(() => {
    // 터치 타겟 크기 적용
    const style = document.createElement('style');
    style.textContent = `
      .touch-target {
        min-height: ${touchTargetSize}px;
        min-width: ${touchTargetSize}px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [touchTargetSize]);

  return (
    <VStack spacing={4}>
      <Text fontWeight="bold">모바일 접근성 설정</Text>
      
      <Box>
        <Text fontSize="sm" mb={2}>
          터치 타겟 크기: {touchTargetSize}px
        </Text>
        <HStack>
          <Button
            size="sm"
            onClick={() => setTouchTargetSize(Math.max(32, touchTargetSize - 4))}
          >
            -
          </Button>
          <Button
            size="sm"
            onClick={() => setTouchTargetSize(Math.min(60, touchTargetSize + 4))}
          >
            +
          </Button>
        </HStack>
      </Box>

      <Text fontSize="xs" color="gray.600">
        권장 터치 타겟 크기: 44px 이상
      </Text>
    </VStack>
  );
};

// 🎨 접근성 데모 컴포넌트
export const AccessibilityDemo: React.FC = () => {
  const { announce, AnnouncementRegion } = useAnnouncement();
  const isHighContrast = useHighContrastMode();

  return (
    <VStack spacing={6} align="stretch" p={6}>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">
        ♿ 접근성 도우미 데모
      </Text>

      <AnnouncementRegion />

      {/* 스킵 링크 */}
      <Box position="relative">
        <SkipLink href="#main-content">
          메인 콘텐츠로 건너뛰기
        </SkipLink>
      </Box>

      {/* 고대비 모드 감지 */}
      {isHighContrast && (
        <AccessibilityAlert
          type="info"
          title="고대비 모드 감지됨"
          description="고대비 모드가 활성화되어 있습니다."
        />
      )}

      {/* 폰트 크기 조절 */}
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <Text fontWeight="bold" mb={3}>글자 크기 조절</Text>
        <FontSizeController />
      </Box>

      {/* 라이브 리전 테스트 */}
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <Text fontWeight="bold" mb={3}>스크린 리더 알림 테스트</Text>
        <Button
          onClick={() => announce('버튼이 클릭되었습니다!')}
          colorScheme="green"
        >
          알림 테스트
        </Button>
      </Box>

      {/* 접근성 검사 도구 */}
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <Text fontWeight="bold" mb={3}>접근성 검사 도구</Text>
        <AccessibilityChecker />
      </Box>

      {/* 모바일 접근성 */}
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <MobileAccessibilityHelper />
      </Box>

      {/* 메인 콘텐츠 영역 */}
      <Box id="main-content" p={4} bg="blue.50" borderRadius="md">
        <Text fontWeight="bold">메인 콘텐츠 영역</Text>
        <Text>스킵 링크로 이동할 수 있는 메인 콘텐츠입니다.</Text>
      </Box>
    </VStack>
  );
};

export default AccessibilityDemo;
