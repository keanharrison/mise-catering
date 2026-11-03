import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Check } from '../../components/icons'
import { mise } from '../../components/mise'
import { authConfigured, supabase } from '../../lib/supabase'
import { signOut } from '../../state/auth'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Separator } from '../../components/ui/separator'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { catalog } from '../../data'
import { formatMoney } from '../../lib/format'
import { useDemoAccount } from '../../state/demoAccount'
import { useDemoStore } from '../../state/store'
import { CUSTOMER_PROFILE_KEY, emptyCustomerProfile, readCustomerProfile, type CustomerProfile } from '../../state/customerProfile'

function CustomerSettings() {
  const [savedProfile, setSavedProfile] = useState<CustomerProfile>(readCustomerProfile)
  const [profile, setProfile] = useState<CustomerProfile>(() => ({ ...savedProfile }))
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerProfile, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [signInEmail, setSignInEmail] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      setSignInEmail(data.user?.email ?? null)
      setVerified(Boolean(data.user?.email_confirmed_at))
    })
  }, [])
  async function signOutOthers() {
    await supabase?.auth.signOut({ scope: 'others' })
    toast.success('Signed out of your other devices.')
  }
  const dirty = useMemo(() => (Object.keys(emptyCustomerProfile) as (keyof CustomerProfile)[]).some((key) => profile[key] !== savedProfile[key]), [profile, savedProfile])

  function update<K extends keyof CustomerProfile>(key: K, value: CustomerProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSaveError('')
  }

  function discard() {
    setProfile({ ...savedProfile })
    setErrors({})
    setSaveError('')
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !dirty) return
    const nextErrors: Partial<Record<keyof CustomerProfile, string>> = {}
    if (!profile.name.trim()) nextErrors.name = 'Enter a contact name.'
    if (!profile.email.trim()) nextErrors.email = 'Enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!profile.phone.trim()) nextErrors.phone = 'Enter a phone number.'
    setErrors(nextErrors)
    const first = (Object.keys(nextErrors) as (keyof CustomerProfile)[])[0]
    if (first) {
      document.getElementById(`profile-${first}`)?.focus()
      return
    }
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      const normalized: CustomerProfile = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        organization: profile.organization.trim(),
      }
      localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(normalized))
      setSavedProfile(normalized)
      setProfile(normalized)
      toast.success('Contact details saved on this device.')
    } catch {
      setSaveError('Could not save in this browser. Your entered details are still here; try again.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const fields: { key: keyof CustomerProfile; label: string; autocomplete: string; type?: string; optional?: boolean }[] = [
    { key: 'name', label: 'Name', autocomplete: 'name' },
    { key: 'email', label: 'Email', autocomplete: 'email', type: 'email' },
    { key: 'phone', label: 'Phone', autocomplete: 'tel', type: 'tel' },
    { key: 'organization', label: 'Company or organization', autocomplete: 'organization', optional: true },
  ]

  const initial = (savedProfile.name.trim()[0] ?? savedProfile.email.trim()[0] ?? '?').toUpperCase()

  return <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
    <h1 className={mise.title}>Account settings.</h1>
    <p className={`mt-3 mb-8 ${mise.lead}`}>Your contact details, saved for new requests.</p>
    <form onSubmit={save} noValidate className="flex flex-col gap-8 sm:flex-row sm:gap-12">
      <div aria-hidden="true" className="flex size-24 shrink-0 select-none items-center justify-center self-start rounded-full bg-secondary text-3xl font-medium text-muted-foreground">{initial}</div>
      <div className="min-w-0 max-w-sm flex-1">
        <FieldGroup className="gap-4">{fields.map(({ key, label, autocomplete, type, optional }) => {
          const id = `profile-${key}`
          const errorId = `${id}-error`
          return <Field key={key} data-invalid={Boolean(errors[key]) || undefined} className="gap-0">
            <FieldLabel htmlFor={id} className={`${mise.label} font-normal`}>{label}{optional ? ' (optional)' : ' (required)'}</FieldLabel>
            <Input id={id} name={key} type={type ?? 'text'} autoComplete={autocomplete} required={!optional} value={profile[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? errorId : undefined} className={mise.input} onChange={(event) => update(key, event.target.value)} />
            {errors[key] && <FieldError id={errorId} className="mt-2">{errors[key]}</FieldError>}
          </Field>
        })}</FieldGroup>
        {saveError && <Alert variant="destructive" className="mt-5"><AlertTitle>Could not save changes</AlertTitle><AlertDescription>{saveError}</AlertDescription></Alert>}
        <Button type="submit" disabled={!dirty || saving} className={`mt-6 w-full ${mise.primary}`}>{saving ? 'Saving…' : 'Save'}</Button>
        <p className="mt-4 text-center"><button type="button" disabled={!dirty || saving} onClick={discard} className={mise.link}>Cancel</button></p>
        <p className="mt-5 text-[12px] leading-[1.5] text-muted-foreground">Saved details fill blank contact fields on new requests. Existing drafts and orders keep their original information.</p>

        <hr className={`my-10 ${mise.rule}`} />
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Emails</h2>
          <p className={`mt-1 mb-4 text-[14px] leading-[1.55] text-muted-foreground`}>We send email about your requests to your primary email.</p>
          <div className="flex flex-wrap items-center gap-3 border border-primary px-3.5 py-3">
            <span className="text-[15px]">{signInEmail ?? (savedProfile.email || 'No email saved yet')}</span>
            <span className={`bg-foreground px-2 py-0.5 text-background ${mise.mono}`}>Primary</span>
            {verified && <span className={`inline-flex items-center gap-1 text-success ${mise.mono}`}><Check aria-hidden="true" style={{ width: 14, height: 14 }} />Verified</span>}
          </div>
        </div>

        {authConfigured && <>
          <hr className={`my-10 ${mise.rule}`} />
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Sessions</h2>
            <p className={`mt-1 mb-4 text-[14px] leading-[1.55] text-muted-foreground`}>Sign out on every other browser and device. You stay signed in here.</p>
            <div className="grid gap-3">
              <Button type="button" variant="outline" className={mise.outline} onClick={() => void signOutOthers()}>Sign out other devices</Button>
              <Button type="button" variant="outline" className={mise.outline} onClick={() => void signOut()}>Sign out</Button>
            </div>
          </div>
        </>}
      </div>
    </form>
  </section>
}

function StaffSettings() {
  const order = useDemoStore((state) => state.order)
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const items = catalog.menu.filter((item) => item.category !== 'supply')
  return <section className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8"><header className="mb-6"><h1 className="type-page-title">Menu and rules settings</h1></header><Alert className="mb-5"><AlertDescription>Menu availability and business rules are reference-only and are not connected to order calculations.</AlertDescription></Alert><Tabs defaultValue="menu"><TabsList><TabsTrigger value="menu">Menu</TabsTrigger><TabsTrigger value="rules">Rules</TabsTrigger></TabsList><TabsContent value="menu"><Card><CardHeader><CardTitle>Menu items</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Data status</TableHead><TableHead>Display preview</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="capitalize">{item.category}</TableCell><TableCell>{formatMoney(item.priceCents)} / {item.unit}</TableCell><TableCell><Badge variant="outline">{item.status}</Badge></TableCell><TableCell><div className="flex items-center gap-2"><Switch id={`available-${item.id}`} checked={enabled[item.id] ?? true} onCheckedChange={(checked) => setEnabled({ ...enabled, [item.id]: checked })} /><Label htmlFor={`available-${item.id}`} className="text-xs">{(enabled[item.id] ?? true) ? 'Shown' : 'Hidden'}</Label></div></TableCell></TableRow>)}</TableBody></Table></div><Separator className="my-4" /><p className="text-xs text-muted-foreground">Display preview does not change what customers see or the estimate for the current request.</p></CardContent></Card></TabsContent><TabsContent value="rules"><Card><CardHeader><CardTitle>Ordering assumptions</CardTitle><CardDescription>Values currently used by the estimate and exception engine.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Rule</TableHead><TableHead>Current value</TableHead><TableHead>Data status</TableHead><TableHead>Assumption</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Large order review</TableCell><TableCell>Over {catalog.exceptionThresholds.largeOrderOverGuests} guests</TableCell><TableCell><Badge variant="outline">{catalog.exceptionThresholds.status}</Badge></TableCell><TableCell>{catalog.exceptionThresholds.assumption}</TableCell></TableRow><TableRow><TableCell>Change cutoff</TableCell><TableCell>{catalog.changePolicy.changeCutoffHours} hours</TableCell><TableCell><Badge variant="outline">{catalog.changePolicy.status}</Badge></TableCell><TableCell>{catalog.changePolicy.assumption}</TableCell></TableRow>{catalog.portionRules.map((rule) => <TableRow key={rule.id}><TableCell className="capitalize">{rule.category} portions</TableCell><TableCell>{rule.servingsPerGuest} per guest</TableCell><TableCell><Badge variant="outline">{rule.status}</Badge></TableCell><TableCell>{rule.assumption}</TableCell></TableRow>)}</TableBody></Table></div><p className="mt-4 text-xs text-muted-foreground">{order.status === 'draft' ? 'No customer request is currently active.' : `Current request ${order.id} continues to use these existing rules.`} Editing business rules is intentionally not offered until Pearl Island confirms them.</p></CardContent></Card></TabsContent></Tabs></section>
}

export function SettingsPage() {
  const { account } = useDemoAccount()
  return account === 'team' ? <StaffSettings /> : <CustomerSettings />
}
