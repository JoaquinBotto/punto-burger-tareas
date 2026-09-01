import { describe, it, expect } from 'vitest'
import fullLogo from '../assets/brand/punto-burger-logo.png'
import compactLogo from '../assets/brand/punto-burger-logo-compact.png'
import icon from '../assets/brand/punto-burger-icon.png'

describe('Official Brand Identity Assets', () => {
  it('should import official brand logo assets successfully', () => {
    expect(fullLogo).toBeDefined()
    expect(typeof fullLogo).toBe('string')

    expect(compactLogo).toBeDefined()
    expect(typeof compactLogo).toBe('string')

    expect(icon).toBeDefined()
    expect(typeof icon).toBe('string')
  })
})
