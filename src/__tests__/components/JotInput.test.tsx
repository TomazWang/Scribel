import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JotInput } from '../../components/JotInput';

describe('JotInput', () => {
  it('renders input field with placeholder', () => {
    render(<JotInput onSubmit={vi.fn()} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    expect(input).toBeInTheDocument();
  });

  it('calls onSubmit when Enter is pressed with non-empty content', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    // Type content
    fireEvent.change(input, { target: { value: 'Test jot content' } });

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('Test jot content');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('clears input after submission', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?") as HTMLInputElement;

    // Type content
    fireEvent.change(input, { target: { value: 'Test jot' } });
    expect(input.value).toBe('Test jot');

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Input should be cleared
    expect(input.value).toBe('');
  });

  it('does not submit empty content', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    // Press Enter without typing
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit whitespace-only content', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    // Type only whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims whitespace before submitting', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    // Type content with leading/trailing whitespace
    fireEvent.change(input, { target: { value: '  Test jot  ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('Test jot');
  });

  it('calls onSubmit when submit button is clicked', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    const submitButton = screen.getByLabelText('Submit jot');

    // Type content
    fireEvent.change(input, { target: { value: 'Test jot' } });

    // Click submit button
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith('Test jot');
  });

  it('disables submit button when input is empty', () => {
    render(<JotInput onSubmit={vi.fn()} />);

    const submitButton = screen.getByLabelText('Submit jot');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has content', () => {
    render(<JotInput onSubmit={vi.fn()} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    const submitButton = screen.getByLabelText('Submit jot');

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Type content
    fireEvent.change(input, { target: { value: 'Test' } });

    // Should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('disables input and submit button when disabled prop is true', () => {
    render(<JotInput onSubmit={vi.fn()} disabled={true} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    const submitButton = screen.getByLabelText('Submit jot');

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('does not call onSubmit when disabled', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} disabled={true} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    // Try to type and submit (should be blocked by disabled state)
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when Shift+Enter is pressed', () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('displays usage hint for tags and links', () => {
    render(<JotInput onSubmit={vi.fn()} />);

    expect(screen.getByText(/Use/)).toBeInTheDocument();
    expect(screen.getByText(/#tags/)).toBeInTheDocument();
    expect(screen.getByText(/\[\[links\]\]/)).toBeInTheDocument();
  });

  it('allows typing special characters in input', () => {
    render(<JotInput onSubmit={vi.fn()} />);

    const input = screen.getByPlaceholderText("What's on your mind?") as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Meeting #work [[Project]] @2pm' } });
    expect(input.value).toBe('Meeting #work [[Project]] @2pm');
  });
});
