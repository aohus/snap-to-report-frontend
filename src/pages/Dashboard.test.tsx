import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { api } from '@/lib/api';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getJobs: vi.fn(),
    getSites: vi.fn(),
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

describe('Dashboard Component - Initial State and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Shows Loader initially', async () => {
    // Make API calls pending
    (api.getJobs as any).mockReturnValue(new Promise(() => {}));
    (api.getSites as any).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Initial state should show loader
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('Shows Error Toast when data loading fails', async () => {
    // Simulate API failure
    (api.getJobs as any).mockRejectedValue(new Error('Network Error'));
    (api.getSites as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the async effect to finish and show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load data');
    });
  });
});