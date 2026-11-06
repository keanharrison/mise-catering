// A demo request needs a restaurant's own address, so personal mailboxes are turned away.
const PERSONAL_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com'])

export const isWorkEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim()) && !PERSONAL_DOMAINS.has(email.trim().toLowerCase().split('@')[1] ?? '')

export const WORK_EMAIL_ERROR = "Use your restaurant's work email. Personal addresses like gmail.com can't be used to request a demo."

/** Hand-off from the landing page to the demo form. Kept in session storage so the address never appears in a URL. */
export const DEMO_EMAIL_KEY = 'mise-demo-email'
