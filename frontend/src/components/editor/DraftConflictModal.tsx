import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  useBreakpointValue
} from '@chakra-ui/react'
import type { PostDraft } from '../../hooks/useDraftAutoSave'

type ConflictVariant = 'soft' | 'hard'

interface DraftConflictModalProps {
  isOpen: boolean
  variant: ConflictVariant
  conflictDraft: PostDraft | null
  onKeepLocal: () => void
  onReloadRemote: () => void
  onDismiss: () => void
}

const formatTimestamp = (input?: string | null): string | null => {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

const DraftConflictModal: React.FC<DraftConflictModalProps> = ({
  isOpen,
  variant,
  conflictDraft,
  onKeepLocal,
  onReloadRemote,
  onDismiss
}) => {
  const lastSavedLabel = formatTimestamp(conflictDraft?.updated_at ?? conflictDraft?.created_at)
  const size = useBreakpointValue({ base: 'full', md: 'lg' })

  const headline = variant === 'soft' ? '다른 기기에서 변경되었습니다' : '원본과 충돌이 발생했습니다'
  const description = variant === 'soft'
    ? '다른 세션에서 같은 초안이 저장되었습니다. 내 변경 사항은 안전하게 보관되어 있으며, 어떻게 처리할지 결정할 때까지 자동 저장이 일시 중지됩니다.'
    : '다른 기기에서 더 최신 버전이 저장되었습니다. 아래 버튼을 사용해 내 변경을 유지하거나, 서버 버전을 확인할 수 있습니다.'

  return (
    <Modal isOpen={isOpen} onClose={onDismiss} isCentered closeOnOverlayClick={false} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{headline}</ModalHeader>
        <ModalCloseButton aria-label="충돌 해결 창 닫기" />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text>{description}</Text>
            {lastSavedLabel && (
              <Text fontSize="sm" color="gray.500">
                서버에 마지막으로 저장된 시간: {lastSavedLabel}
              </Text>
            )}
            <Text fontSize="sm" color="gray.500">
              충돌을 해결하기 전까지 자동 저장이 중단됩니다.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter display="flex" gap={2}>
          <Button onClick={onKeepLocal} colorScheme="blue" data-testid="draft-conflict-keep-local">
            내 변경 유지
          </Button>
          <Button onClick={onReloadRemote} variant="outline" colorScheme="gray" data-testid="draft-conflict-reload">
            원본 다시 불러오기
          </Button>
          <Button onClick={onDismiss} variant="ghost" data-testid="draft-conflict-cancel">
            취소
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default DraftConflictModal
