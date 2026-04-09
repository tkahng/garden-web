import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders the store name', () => {
    render(<Footer />)
    expect(screen.getByText('The Garden Shop')).toBeInTheDocument()
  })

  it('renders the brand tagline', () => {
    render(<Footer />)
    expect(screen.getByText(/Plants, seeds & tools/i)).toBeInTheDocument()
  })

  it('renders Shop column with Products and Collections links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: 'Collections' })).toHaveAttribute('href', '/collections')
  })

  it('renders Company column with About and Home links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument()
  })

  it('renders social links for X and GitHub', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /Follow.*on X/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/i })).toBeInTheDocument()
  })
})
