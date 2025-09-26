import React from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Button,
  CloseButton,
  Flex,
  Stack
} from '@chakra-ui/react'

type ConflictVariant = 'soft' | 'hard'

interface DraftConflictBannerProps {
  variant: ConflictVariant
  onKeepLocal: () => void
  onReloadRemote: () => void
  onDismiss: () => void
}

const DraftConflictBanner: React.FC<DraftConflictBannerProps> = ({
  variant,
  onKeepLocal,
  onReloadRemote,
  onDismiss
}) => {
  const description = variant === 'soft'
    ? '다른 기기에서 같은 초안을 저장했습니다. 충돌을 해결할 때까지 자동 저장이 일시 중지되었습니다.'
    : '다른 기기에서 최신 버전이 저장되었습니다. 원본을 불러오거나 내 변경을 유지해서 충돌을 해결하세요.'

  return (
    <Alert status="warning" data-testid="draft-conflict-banner" borderRadius="md" alignItems="flex-start">
      <AlertIcon mt={1} />
      <Flex flex="1" direction={{ base: 'column', md: 'row' }} gap={3} align={{ base: 'flex-start', md: 'center' }}>
        <Stack spacing={1} flex="1">
          <AlertTitle fontWeight="semibold">자동 저장이 중단되었습니다.</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Stack>
        <HStack spacing={2} alignSelf={{ base: 'stretch', md: 'center' }}>
          <Button size="sm" colorScheme="blue" onClick={onKeepLocal}>
            내 변경 유지
          </Button>
          <Button size="sm" variant="outline" onClick={onReloadRemote}>
            원본 다시 불러오기
          </Button>
          <CloseButton onClick={onDismiss} aria-label="충돌 배너 닫기" />
        </HStack>
      </Flex>
    </Alert>
  )
}

export default DraftConflictBanner

