// @vitest-environment jsdom
import { cleanup, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { useDemoStore } from './state/store'
import { renderAppAt } from './test/renderApp'

beforeEach(() => {
  localStorage.clear()
  useDemoStore.getState().loadScenario('routine')
  useDemoStore.getState().startBlankDraft()
})
afterEach(cleanup)

function header() {
  return within(document.querySelector('[data-slot="site-header"]') as HTMLElement)
}

describe('top bar', () => {
  it.each(['/customer', '/customer/ask-pearl', '/customer/orders', '/customer/messages', '/settings'])('is present on %s with the page title and the account link', (path) => {
    renderAppAt(path, <AppRoutes />)
    expect(header().getByRole('button', { name: 'Toggle navigation' })).toBeTruthy()
    expect(header().queryByRole('button', { name: 'Notifications' })).toBeNull()
    expect(header().queryByRole('link', { name: 'Ask' })).toBeNull()
    expect(header().getByRole('link', { name: 'Account settings' }).getAttribute('href')).toBe('/settings')
  })

  it('names the page in the bar', () => {
    renderAppAt('/customer/orders', <AppRoutes />)
    expect(header().getByText('Current orders')).toBeTruthy()
  })

  it('stays on staff pages with only the account link', () => {
    localStorage.setItem('pi2go-demo-account', 'team')
    renderAppAt('/staff', <AppRoutes />)
    expect(header().getByText('Requests')).toBeTruthy()
    expect(header().getByRole('link', { name: 'Account settings' }).getAttribute('href')).toBe('/staff/settings')
  })
})
