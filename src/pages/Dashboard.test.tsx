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

describe('Dashboard Component - Modern Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getJobs as any).mockResolvedValue([]);
    (api.getSites as any).mockResolvedValue([]);
  });

  it('renders the modern professional header', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Field Note')).toBeInTheDocument();
      expect(screen.getByText('Construction Intelligence')).toBeInTheDocument();
    });
  });

  it('renders the sidebar with site management controls', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('현장 관리')).toBeInTheDocument();
      expect(screen.getByText('미분류 작업')).toBeInTheDocument();
    });
  });

  it('renders bento-grid stats summary', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('전체 프로젝트')).toBeInTheDocument();
      expect(screen.getByText('보고서 완료')).toBeInTheDocument();
      expect(screen.getByText('등록 현장')).toBeInTheDocument();
    });
  });
});
