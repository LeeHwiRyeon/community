import React from 'react';
import { Box, Button, Card, CardBody, CardHeader, Heading, Text, VStack, HStack, Badge, Input, Textarea, Select, Switch, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useColorMode, useColorModeValue } from '@chakra-ui/react';

/**
 * Community Platform v1.1 - 디자인 시스템 컴포넌트
 * 
 * 일관성 있는 UI/UX를 위한 재사용 가능한 컴포넌트들을 제공합니다.
 * 모든 컴포넌트는 다크모드를 지원하며 접근성을 고려하여 설계되었습니다.
 */

// 🎨 컬러 토큰
export const colorTokens = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c4a6e'
  },
  secondary: {
    50: '#fefce8',
    500: '#eab308',
    600: '#ca8a04'
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706'
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  }
};

// 📏 스페이싱 토큰
export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem'   // 64px
};

// 🔤 타이포그래피 토큰
export const typography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

// 🔘 기본 버튼 컴포넌트
interface CustomButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'blue.500',
          color: 'white',
          _hover: { bg: 'blue.600', transform: 'translateY(-1px)' },
          _active: { bg: 'blue.700' }
        };
      case 'secondary':
        return {
          bg: 'transparent',
          color: 'blue.500',
          border: '1px solid',
          borderColor: 'blue.500',
          _hover: { bg: 'blue.50' }
        };
      case 'ghost':
        return {
          bg: 'transparent',
          color: 'gray.700',
          _hover: { bg: 'gray.100' }
        };
      case 'danger':
        return {
          bg: 'red.500',
          color: 'white',
          _hover: { bg: 'red.600' }
        };
      default:
        return {};
    }
  };

  return (
    <Button
      {...getVariantStyles()}
      size={size}
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
      width={fullWidth ? '100%' : 'auto'}
      borderRadius="md"
      fontWeight="medium"
      transition="all 0.2s ease"
      _focus={{
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px'
      }}
    >
      {children}
    </Button>
  );
};

// 📄 커스텀 카드 컴포넌트
interface CustomCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
  padding?: string;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  title,
  subtitle,
  hoverable = false,
  padding = 'lg'
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Card
      bg={bg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      shadow="sm"
      transition="all 0.2s ease"
      _hover={hoverable ? {
        shadow: 'lg',
        transform: 'translateY(-2px)'
      } : {}}
      p={padding}
    >
      {(title || subtitle) && (
        <CardHeader pb={4}>
          {title && (
            <Heading size="md" mb={subtitle ? 1 : 0}>
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text color="gray.600" fontSize="sm">
              {subtitle}
            </Text>
          )}
        </CardHeader>
      )}
      <CardBody pt={title || subtitle ? 0 : 4}>
        {children}
      </CardBody>
    </Card>
  );
};

// 🏷️ 상태 배지 컴포넌트
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'md'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'info': return 'blue';
      case 'neutral': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Badge
      colorScheme={getStatusColor()}
      size={size}
      borderRadius="full"
      px={3}
      py={1}
      fontWeight="medium"
    >
      {children}
    </Badge>
  );
};

// 📝 커스텀 입력 필드
interface CustomInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  type = 'text',
  disabled = false
}) => {
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const focusBorderColor = error ? 'red.500' : 'blue.500';

  return (
    <VStack align="stretch" spacing={2}>
      {label && (
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          {label}
          {required && <Text as="span" color="red.500" ml={1}>*</Text>}
        </Text>
      )}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        borderColor={error ? 'red.500' : borderColor}
        focusBorderColor={focusBorderColor}
        disabled={disabled}
        _focus={{
          boxShadow: `0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 165, 233, 0.1)'}`
        }}
      />
      {error && (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      )}
    </VStack>
  );
};

// 📱 반응형 그리드 컴포넌트
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: { base?: number; md?: number; lg?: number };
  spacing?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { base: 1, md: 2, lg: 3 },
  spacing = 'lg'
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        base: `repeat(${columns.base || 1}, 1fr)`,
        md: `repeat(${columns.md || 2}, 1fr)`,
        lg: `repeat(${columns.lg || 3}, 1fr)`
      }}
      gap={spacing}
    >
      {children}
    </Box>
  );
};

// 🌙 다크모드 토글 컴포넌트
export const ThemeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Button
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
      aria-label={`${colorMode === 'light' ? '다크' : '라이트'} 모드로 전환`}
    >
      {colorMode === 'light' ? '🌙' : '☀️'}
    </Button>
  );
};

// 📊 로딩 스피너 컴포넌트
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue.500'
}) => {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px'
  };

  return (
    <Box
      width={sizeMap[size]}
      height={sizeMap[size]}
      border="2px solid"
      borderColor="gray.200"
      borderTopColor={color}
      borderRadius="50%"
      animation="spin 1s linear infinite"
      sx={{
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    />
  );
};

// 🎯 포커스 트랩 컴포넌트 (접근성)
interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true
}) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
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

    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return (
    <Box ref={trapRef}>
      {children}
    </Box>
  );
};

// 📋 디자인 시스템 데모 컴포넌트
export const DesignSystemDemo: React.FC = () => {
  const [inputValue, setInputValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <VStack spacing={8} align="stretch" p={8}>
      <Heading size="lg" textAlign="center">
        🎨 Community Platform v1.1 디자인 시스템
      </Heading>

      {/* 버튼 섹션 */}
      <CustomCard title="🔘 버튼 컴포넌트" hoverable>
        <VStack spacing={4}>
          <HStack spacing={4} wrap="wrap">
            <CustomButton variant="primary">Primary</CustomButton>
            <CustomButton variant="secondary">Secondary</CustomButton>
            <CustomButton variant="ghost">Ghost</CustomButton>
            <CustomButton variant="danger">Danger</CustomButton>
          </HStack>
          <HStack spacing={4}>
            <CustomButton size="xs">Extra Small</CustomButton>
            <CustomButton size="sm">Small</CustomButton>
            <CustomButton size="md">Medium</CustomButton>
            <CustomButton size="lg">Large</CustomButton>
          </HStack>
          <CustomButton loading={loading} onClick={handleLoadingTest}>
            {loading ? '로딩 중...' : '로딩 테스트'}
          </CustomButton>
        </VStack>
      </CustomCard>

      {/* 배지 섹션 */}
      <CustomCard title="🏷️ 상태 배지" hoverable>
        <HStack spacing={4} wrap="wrap">
          <StatusBadge status="success">성공</StatusBadge>
          <StatusBadge status="warning">경고</StatusBadge>
          <StatusBadge status="error">오류</StatusBadge>
          <StatusBadge status="info">정보</StatusBadge>
          <StatusBadge status="neutral">중립</StatusBadge>
        </HStack>
      </CustomCard>

      {/* 입력 필드 섹션 */}
      <CustomCard title="📝 입력 필드" hoverable>
        <VStack spacing={4}>
          <CustomInput
            label="이메일 주소"
            type="email"
            placeholder="example@email.com"
            value={inputValue}
            onChange={setInputValue}
            required
          />
          <CustomInput
            label="오류 예시"
            placeholder="잘못된 입력"
            error="올바른 형식이 아닙니다"
          />
        </VStack>
      </CustomCard>

      {/* 그리드 섹션 */}
      <CustomCard title="📱 반응형 그리드" hoverable>
        <ResponsiveGrid columns={{ base: 1, md: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((num) => (
            <Box
              key={num}
              p={4}
              bg="blue.50"
              borderRadius="md"
              textAlign="center"
              fontWeight="medium"
            >
              그리드 아이템 {num}
            </Box>
          ))}
        </ResponsiveGrid>
      </CustomCard>

      {/* 유틸리티 섹션 */}
      <CustomCard title="🛠️ 유틸리티" hoverable>
        <HStack spacing={6} justify="center">
          <VStack>
            <Text fontSize="sm" fontWeight="medium">다크모드 토글</Text>
            <ThemeToggle />
          </VStack>
          <VStack>
            <Text fontSize="sm" fontWeight="medium">로딩 스피너</Text>
            <LoadingSpinner size="md" />
          </VStack>
        </HStack>
      </CustomCard>
    </VStack>
  );
};

export default DesignSystemDemo;
