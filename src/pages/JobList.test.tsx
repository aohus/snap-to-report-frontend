import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { api } from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getJobs: vi.fn(),
    getSites: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
  }
}));

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('JobList Component - Create Job Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getJobs as any).mockResolvedValue([]);
    (api.getSites as any).mockResolvedValue([]);
  });

  it('Navigates to the new job page after successful creation', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for data load and click "새 작업 추가"
    await waitFor(() => {
      expect(screen.getByText(/새 작업 추가/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/새 작업 추가/i));
    
    // Check if dialog is open
    expect(screen.getByText('새 작업 만들기')).toBeInTheDocument();

    // Fill form
    const titleInput = screen.getByLabelText('작업명');
    fireEvent.change(titleInput, { target: { value: 'New Test Job' } });

    // Mock Create API
    const newJobId = 'job-new-123';
    (api.createJob as any).mockResolvedValue({ id: newJobId, title: 'New Test Job' });

    // Click Create button (Updated to "작업 생성")
    fireEvent.click(screen.getByText('작업 생성'));

    // Verify API call
    await waitFor(() => {
      expect(api.createJob).toHaveBeenCalled();
    });

    // Verify Navigation (Dashboard uses a small timeout for navigation)
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/jobs/${newJobId}`);
    }, { timeout: 2000 });
  });
});