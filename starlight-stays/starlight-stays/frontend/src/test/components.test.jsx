import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StatusBadge from '../components/StatusBadge';

describe('Frontend Component Tests', () => {
  it('renders CONFIRMED status badge with green indicator', () => {
    const { container } = render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-emerald-50');
  });

  it('renders CANCELLED status badge with slate indicator', () => {
    const { container } = render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });

  it('renders PENDING status badge with pulse icon', () => {
    const { container } = render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('renders FAILED status badge', () => {
    const { container } = render(<StatusBadge status="FAILED" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-rose-50');
  });

  it('renders REFUNDED status badge', () => {
    const { container } = render(<StatusBadge status="REFUNDED" />);
    expect(screen.getByText('Refunded')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-indigo-50');
  });
});
