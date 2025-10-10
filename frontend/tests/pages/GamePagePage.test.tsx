import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import GamePagePage from '@/pages/GamePage/GamePagePage';

// Mock API 서비스
jest.mock('@/services/gamepageService', () => ({
  GamePageService: {
    getData: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
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

describe('GamePagePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders page title correctly', () => {
    renderWithProviders(<GamePagePage />);
    
    expect(screen.getByText('게임 커뮤니티')).toBeInTheDocument();
  });
  
  it('displays loading state initially', () => {
    renderWithProviders(<GamePagePage />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('handles error state correctly', async () => {
    const mockError = new Error('Test error');
    require('@/services/gamepageService').GamePageService.getData.mockRejectedValue(mockError);
    
    renderWithProviders(<GamePagePage />);
    
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
    
    require('@/services/gamepageService').GamePageService.getData.mockResolvedValue(mockData);
    
    renderWithProviders(<GamePagePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });
  
  
  it('renders GameList component', async () => {
    const mockData = { items: [] };
    require('@/services/gamepageService').GamePageService.getData.mockResolvedValue(mockData);
    
    renderWithProviders(<GamePagePage />);
    
    await waitFor(() => {
      expect(screen.getByText('GameList')).toBeInTheDocument();
    });
  });
  it('renders GameBoard component', async () => {
    const mockData = { items: [] };
    require('@/services/gamepageService').GamePageService.getData.mockResolvedValue(mockData);
    
    renderWithProviders(<GamePagePage />);
    
    await waitFor(() => {
      expect(screen.getByText('GameBoard')).toBeInTheDocument();
    });
  });
});