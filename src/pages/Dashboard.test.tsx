import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { api } from '@/lib/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getJob: vi.fn(),
    getJobDetails: vi.fn(),
    uploadPhotos: vi.fn(),
    updateJob: vi.fn(),
    getDownloadUrl: vi.fn(),
    startClustering: vi.fn(),
    updatePhoto: vi.fn(),
    deleteCluster: vi.fn(),
    deleteClusterMember: vi.fn(),
    updateCluster: vi.fn(),
    createCluster: vi.fn(),
    startExport: vi.fn(),
    getExportStatus: vi.fn(),
    getPhotoUrl: vi.fn((url) => url),
  }
}));

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }
}));

describe('Dashboard Component - Error Handling (Fixed)', () => {
  const jobId = 'job-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 1: Shows Error UI when getJobDetails fails (Job Creation)', async () => {
    // Simulate API failure (e.g. 500 error or network error)
    (api.getJobDetails as any).mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
        <Routes>
          <Route path="/jobs/:jobId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial state: Loader
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    // Wait for the async effect to finish
    await waitFor(() => {
      expect(api.getJobDetails).toHaveBeenCalledWith(jobId);
    });

    // NOW: Loader should disappear, Error UI should appear
    await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByText('데이터를 불러오지 못했습니다.')).toBeInTheDocument();
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });
  });

  it('Scenario 2: Shows Error UI when getJobDetails returns undefined (Upload Complete)', async () => {
      // Simulate API returning undefined (e.g. 204 No Content handled in api.ts)
      (api.getJobDetails as any).mockResolvedValue(undefined);
  
      render(
        <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
          <Routes>
            <Route path="/jobs/:jobId" element={<Dashboard />} />
          </Routes>
        </MemoryRouter>
      );
  
      // Initial state: Loader
      expect(screen.getByTestId('loader')).toBeInTheDocument();
  
      // Wait for effect
      await waitFor(() => {
        expect(api.getJobDetails).toHaveBeenCalledWith(jobId);
      });
  
      // NOW: Loader should disappear, Error UI should appear (because !data throws error in fetchJobData)
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByText('데이터를 불러오지 못했습니다.')).toBeInTheDocument();
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
      });
    });
});