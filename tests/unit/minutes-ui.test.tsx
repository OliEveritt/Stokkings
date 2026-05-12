import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MinutesForm from '@/components/forms/MinutesForm';

describe('MinutesForm UI Transitions', () => {
  // Common props for testing
  const defaultProps = {
    meetingId: "123",
    initialMinutes: "Sample minutes",
    meetingDate: "2026-05-12",
    groupId: "group-1",
    agenda: "Test Meeting Agenda"
  };

  it('should switch to edit mode when "Edit Minutes" is clicked', () => {
    render(<MinutesForm {...defaultProps} />);
    
    const editButton = screen.getByText(/Edit Minutes/i);
    fireEvent.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Sample minutes');
  });

  it('should revert changes and exit edit mode when "Cancel" is clicked', () => {
    // Override initialMinutes for this specific test
    render(<MinutesForm {...defaultProps} initialMinutes="Original" />);
    
    // Enter Edit mode
    fireEvent.click(screen.getByText(/Edit Minutes/i));
    
    // Change text
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modified text' } });
    
    // Cancel
    fireEvent.click(screen.getByText(/Cancel/i));
    
    // Should show original text again
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});