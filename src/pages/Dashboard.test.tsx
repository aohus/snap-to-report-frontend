import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('Dashboard Component - White Screen Reproduction', () => {
  const jobId = 'job-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 1: Infinite Loading when getJobDetails fails (Job Creation)', async () => {
    // Simulate API failure (e.g. 500 error or network error)
    (api.getJobDetails as any).mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
        <Routes>
          <Route path="/jobs/:jobId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial state: Loader should be present
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    // Wait for the async effect to finish (and fail)
    await waitFor(() => {
      expect(api.getJobDetails).toHaveBeenCalledWith(jobId);
    });

    // AFTER failure, checks if the Loader is STILL there (Infinite Spinner = White Screen)
    // Since job is null, and error is caught but not handled to change state,
    // the component keeps rendering the Loader.
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    
    // Verify toast was shown (optional, confirming catch block execution)
    // expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to load job data');
  });

  it('Scenario 2: Infinite Loading when getJobDetails returns undefined (Upload Complete)', async () => {
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
  
      // Since job is set to undefined, and the check is `if (!job) return <Loader />`,
      // it should still show the loader.
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
});
