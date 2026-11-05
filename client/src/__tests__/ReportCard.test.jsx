import { render, screen } from '@testing-library/react';
import ReportCard from '../components/ReportCard';
import { formatRange } from '../utils/dates';

describe('ReportCard', () => {
  test('shows highest, lowest, average (1 decimal) and count', () => {
    render(
      <ReportCard
        title="Month to date"
        report={{ from: '2026-10-01', to: '2026-10-15', count: 4, highest: 210, lowest: 95, average: 149 }}
      />,
    );
    expect(screen.getByText('210')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('149.0')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1 Oct – 15 Oct 2026')).toBeInTheDocument();
  });

  test('shows a friendly empty state when there are no readings', () => {
    render(
      <ReportCard
        title="Daily"
        report={{ from: '2026-10-15', to: '2026-10-15', count: 0, highest: null, lowest: null, average: null }}
      />,
    );
    expect(screen.getByText(/no readings for this period yet/i)).toBeInTheDocument();
  });
});

describe('formatRange', () => {
  test('matches the date formats used in the assignment', () => {
    expect(formatRange('2026-10-15', '2026-10-15')).toBe('15 Oct 2026');
    expect(formatRange('2026-09-01', '2026-09-30')).toBe('1 Sep – 30 Sep 2026');
    expect(formatRange('2025-12-01', '2026-01-05')).toBe('1 Dec 2025 – 5 Jan 2026');
  });
});
