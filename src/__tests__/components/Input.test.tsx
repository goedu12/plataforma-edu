import { render, screen, fireEvent } from '@testing-library/react'
import Input from '@/components/ui/Input'

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Input label="Username" />)
    expect(screen.getByText(/username/i)).toBeInTheDocument()
  })

  it('shows error message when provided', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
  })

  it('shows helper text when provided', () => {
    render(<Input helper="Enter your email" />)
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument()
  })

  it('hides helper text when error is shown', () => {
    render(<Input error="Error" helper="Helper" />)
    expect(screen.getByText(/error/i)).toBeInTheDocument()
    expect(screen.queryByText(/helper/i)).not.toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies disabled state', () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText(/disabled/i)).toBeDisabled()
  })
})
