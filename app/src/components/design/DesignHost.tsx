import { useEffect } from 'react'
import { applyTheme, useDesignTheme } from '../../lib/designTheme'
import { DesignPanel } from './DesignPanel'

/**
 * Mounts the Design panel over the product and applies the chosen theme to the whole page as it changes.
 * Choices are saved in the browser (shared with the sign-in page); nothing here changes the code or other users.
 */
export function DesignHost() {
  const [theme, patch, reset] = useDesignTheme()
  useEffect(() => { applyTheme(theme) }, [theme])
  return <DesignPanel theme={theme} onChange={patch} onReset={reset} surface="product" />
}
