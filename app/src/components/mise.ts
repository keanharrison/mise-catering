/**
 * Class sets lifted from the Mise sign-in page (src/login/login.css), so a screen can match it exactly.
 * Used on the two settings pages first; once those are final they move into the shared Input, Select and Button.
 */
export const mise = {
  /** "Sign in." headline: 32px, semibold, tight. */
  title: 'text-foreground text-[32px] font-semibold leading-[1.1] tracking-[-0.02em]',
  /** The line under the headline. */
  lead: 'text-foreground text-[14px] leading-[1.55]',
  /** Field label: small, tight, above the box. */
  label: 'mb-2 block text-foreground text-[12px] tracking-[-0.01em]',
  /** Boxed field: 1px orange border, 15px text, roomy padding, border darkens on focus. */
  input: 'h-auto rounded-none border border-primary bg-background px-3.5 py-3 text-[15px] shadow-none focus-visible:border-primary-hover focus-visible:ring-0 dark:bg-background',
  /** Solid orange action, 14px medium. */
  primary: 'h-auto rounded-none px-3.5 py-3 text-[14px] font-medium tracking-[-0.01em]',
  /** Outlined orange action with the same size. */
  outline: 'h-auto rounded-none px-3.5 py-3 text-[14px] font-medium tracking-[-0.01em]',
  /** Mono utility text, as in the sign-in nav and footer. */
  mono: 'font-mono text-[12px] tracking-[-0.01em]',
  /** A full-strength orange rule. */
  rule: 'border-0 border-t border-primary',
  /** Mono text link: ink, orange on hover. */
  link: 'font-mono text-[12px] tracking-[-0.01em] text-foreground outline-none transition-colors hover:text-primary focus-visible:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground',
} as const
