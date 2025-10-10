import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NewsPagePage from '../../src/pages/NewsPage/NewsPage';

// Mock API 서비스
vi.mock('../../src/services/newspageService', () => ({
  NewsPageService: {
    getData: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('NewsPagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title correctly', () => {
    renderWithProviders(<NewsPagePage />);

    expect(screen.getByText('뉴스')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<NewsPagePage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    const mockError = new Error('Test error');
    vi.mocked(require('../../src/services/newspageService').NewsPageService.getData).mockRejectedValue(mockError);

    renderWithProviders(<NewsPagePage />);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('renders data correctly when loaded', async () => {
    const mockData = {
      items: [
        { id: '1', title: 'Test Item 1' },
        { id: '2', title: 'Test Item 2' }
      ],
      totalPages: 1,
      currentPage: 1
    };

    vi.mocked(require('../../src/services/newspageService').NewsPageService.getData).mockResolvedValue(mockData);

    renderWithProviders(<NewsPagePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });


  it('renders NewsList component', async () => {
    const mockData = { items: [] };
    vi.mocked(require('../../src/services/newspageService').NewsPageService.getData).mockResolvedValue(mockData);

    renderWithProviders(<NewsPagePage />);

    await waitFor(() => {
      expect(screen.getByText('NewsList')).toBeInTheDocument();
    });
  });
  it('renders NewsFilters component', async () => {
    const mockData = { items: [] };
    vi.mocked(require('../../src/services/newspageService').NewsPageService.getData).mockResolvedValue(mockData);

    renderWithProviders(<NewsPagePage />);

    await waitFor(() => {
      expect(screen.getByText('NewsFilters')).toBeInTheDocument();
    });
  });
});