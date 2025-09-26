import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BroadcastCard } from '../src/components/BroadcastCard'
import { BroadcastPreview } from '../src/pages/post-helpers'

const mockBroadcastPreview: BroadcastPreview = {
    type: 'broadcast',
    streamer: 'TestStreamer',
    platform: 'Twitch',
    streamUrl: 'https://twitch.tv/teststreamer',
    scheduledFor: '2024-08-22T12:00:00Z',
    scheduleLabel: '21:00 KST',
    isLive: false,
    tags: ['Ranked', 'Coaching'],
    thumbnail: 'https://example.com/thumbnail.jpg'
}

describe('BroadcastCard', () => {
    it('renders broadcast information correctly', () => {
        render(<BroadcastCard preview={mockBroadcastPreview} />)

        expect(screen.getByText('TestStreamer')).toBeInTheDocument()
        expect(screen.getByText('Twitch')).toBeInTheDocument()
        expect(screen.getByText('21:00 KST')).toBeInTheDocument()
        expect(screen.getByText('Ranked')).toBeInTheDocument()
        expect(screen.getByText('Coaching')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /방송 보러가기/i })).toBeInTheDocument()
    })

    it('shows live indicator when broadcast is live', () => {
        const livePreview = { ...mockBroadcastPreview, isLive: true }
        render(<BroadcastCard preview={livePreview} />)

        expect(screen.getByText('🔴 LIVE')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /라이브 시청하기/i })).toBeInTheDocument()
    })

    it('renders thumbnail when provided', () => {
        render(<BroadcastCard preview={mockBroadcastPreview} />)

        const image = screen.getByAltText('TestStreamer 방송')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
    })
})