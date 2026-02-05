import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DesignGallery from './DesignGallery';

describe('DesignGallery Page', () => {
  it('renders the main header', () => {
    render(<DesignGallery />);
    expect(screen.getByText('Design System Gallery')).toBeInTheDocument();
  });

  it('renders all major design system sections', () => {
    render(<DesignGallery />);
    
    // Check for section headings (using getAllBy because the text might appear in labels too)
    expect(screen.getAllByText(/Typography/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Colors/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Surfaces & Shadows/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Components/i).length).toBeGreaterThan(0);
  });

  it('renders typography examples', () => {
    render(<DesignGallery />);
    expect(screen.getByText('Typography Scale')).toBeInTheDocument();
    // Use getAllBy because the example text is repeated for H1, H2, H3
    expect(screen.getAllByText(/The quick brown fox/i).length).toBe(3);
  });

  it('renders color palette and surface hierarchy', () => {
    render(<DesignGallery />);
    expect(screen.getByText('Primary Palette (Professional Navy)')).toBeInTheDocument();
    expect(screen.getByText('Surface Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Surface 1 (Base / Card)')).toBeInTheDocument();
  });

  it('renders base UI components with variants', () => {
    render(<DesignGallery />);
    
    // Check buttons
    expect(screen.getByText('Primary Action')).toBeInTheDocument();
    expect(screen.getByText('Outline')).toBeInTheDocument();
    expect(screen.getByText('Destructive')).toBeInTheDocument();
    
    // Check inputs
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    
    // Check badges
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
