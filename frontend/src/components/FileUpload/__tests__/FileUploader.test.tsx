import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploader from '../FileUploader';

// fetch 모킹
global.fetch = jest.fn();

// URL.createObjectURL 모킹
global.URL.createObjectURL = jest.fn(() => 'mocked-url');

const mockProps = {
    onFileUploaded: jest.fn(),
    onFileDeleted: jest.fn(),
    maxFileSize: 10,
    allowedTypes: ['image/*', 'application/pdf'],
    multiple: true,
    maxFiles: 5
};

describe('FileUploader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();
    });

    it('컴포넌트가 정상적으로 렌더링된다', () => {
        render(<FileUploader {...mockProps} />);

        expect(screen.getByText('파일을 드래그하거나 클릭하여 업로드')).toBeInTheDocument();
        expect(screen.getByText('최대 10MB, 5개 파일까지')).toBeInTheDocument();
    });

    it('파일 선택이 정상적으로 작동한다', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                file: {
                    id: '1',
                    name: 'test.txt',
                    url: '/uploads/test.txt',
                    size: 12,
                    type: 'text/plain'
                }
            })
        });

        render(<FileUploader {...mockProps} />);

        const fileInput = screen.getByRole('button', { hidden: true });
        fireEvent.click(fileInput);

        // 파일 선택 시뮬레이션
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/upload', expect.any(Object));
        });
    });

    it('드래그 앤 드롭이 정상적으로 작동한다', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                file: {
                    id: '1',
                    name: 'test.txt',
                    url: '/uploads/test.txt',
                    size: 12,
                    type: 'text/plain'
                }
            })
        });

        render(<FileUploader {...mockProps} />);

        const dropZone = screen.getByText('파일을 드래그하거나 클릭하여 업로드').closest('div');

        // 드래그 이벤트 시뮬레이션
        fireEvent.dragOver(dropZone!, { dataTransfer: { files: [file] } });
        fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/upload', expect.any(Object));
        });
    });

    it('파일 크기 제한을 초과하면 오류가 표시된다', async () => {
        const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });

        render(<FileUploader {...mockProps} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [largeFile] } });

        await waitFor(() => {
            expect(screen.getByText(/파일 크기는 10MB를 초과할 수 없습니다/)).toBeInTheDocument();
        });
    });

    it('지원되지 않는 파일 형식은 거부된다', async () => {
        const unsupportedFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });

        render(<FileUploader {...mockProps} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [unsupportedFile] } });

        await waitFor(() => {
            expect(screen.getByText(/지원되지 않는 파일 형식입니다/)).toBeInTheDocument();
        });
    });

    it('최대 파일 수를 초과하면 경고가 표시된다', async () => {
        const files = Array.from({ length: 6 }, (_, i) =>
            new File(['test'], `test${i}.txt`, { type: 'text/plain' })
        );

        render(<FileUploader {...mockProps} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files } });

        await waitFor(() => {
            expect(screen.getByText(/최대 5개의 파일만 업로드할 수 있습니다/)).toBeInTheDocument();
        });
    });

    it('파일 업로드 성공 시 콜백이 호출된다', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const mockOnFileUploaded = jest.fn();

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                file: {
                    id: '1',
                    name: 'test.txt',
                    url: '/uploads/test.txt',
                    size: 12,
                    type: 'text/plain'
                }
            })
        });

        render(<FileUploader {...mockProps} onFileUploaded={mockOnFileUploaded} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockOnFileUploaded).toHaveBeenCalledWith(expect.objectContaining({
                id: '1',
                name: 'test.txt',
                url: '/uploads/test.txt'
            }));
        });
    });

    it('파일 삭제가 정상적으로 작동한다', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

        // 업로드 성공 모킹
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                file: {
                    id: '1',
                    name: 'test.txt',
                    url: '/uploads/test.txt',
                    size: 12,
                    type: 'text/plain'
                }
            })
        });

        render(<FileUploader {...mockProps} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });

        // 삭제 성공 모킹
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        const deleteButton = screen.getByLabelText('파일 삭제');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/upload/1', expect.any(Object));
        });
    });
});
