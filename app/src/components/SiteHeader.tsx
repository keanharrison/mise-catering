import { Link, useLocation } from 'react-router-dom'
import { PanelLeftIcon } from './icons'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { pageTitle } from '@/lib/pageTitle'
import { routes } from '@/routes'
import { useDemoAccount } from '@/state/demoAccount'
import { readCustomerProfile } from '@/state/customerProfile'
import { mise } from './mise'

// The persistent top bar, laid out like the Mise sign-in nav: white bar, orange rule underneath, mono 12px text.
// Sidebar toggle and page title on the left; the account link on the right.
export function SiteHeader() {
  const { pathname } = useLocation()
  const { account } = useDemoAccount()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const accountPath = account === 'team' ? routes.staffSettings : routes.settings
  const accountLabel = account === 'team' ? 'Account' : readCustomerProfile().name.trim() || 'Account'
  const sidebarShown = isMobile ? openMobile : open

  return (
    <header data-slot="site-header" className="sticky top-0 z-40 flex h-[3.25rem] w-full shrink-0 items-center gap-2 border-b border-primary bg-background px-3 sm:px-4">
      <Tooltip>
        <TooltipTrigger
          aria-label="Toggle navigation"
          aria-expanded={sidebarShown}
          onClick={toggleSidebar}
          render={<button type="button" className="flex size-11 shrink-0 items-center justify-center text-foreground transition-colors duration-150 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-9" />}
        >
          <PanelLeftIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{sidebarShown ? 'Close sidebar' : 'Open sidebar'}</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <p className={`truncate text-foreground ${mise.mono}`}>{pageTitle(pathname, account)}</p>
        {pathname === routes.askPearl && <span className="shrink-0 border border-primary px-2 py-0.5 font-mono text-[11px] leading-none text-primary-ink">Preview</span>}
      </div>

      <nav aria-label="Account" className="flex shrink-0 items-center gap-4">
        <Link
          to={accountPath}
          aria-label="Account settings"
          aria-current={pathname === accountPath ? 'page' : undefined}
          className={`max-w-40 truncate px-1 py-3 text-foreground no-underline transition-colors hover:text-primary focus-visible:underline focus-visible:outline-none aria-[current=page]:text-primary-ink ${mise.mono}`}
        >
          {accountLabel}
        </Link>
      </nav>
    </header>
  )
}
