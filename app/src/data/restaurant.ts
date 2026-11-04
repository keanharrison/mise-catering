/**
 * The restaurant this site belongs to. Today it is fixed to Pearl Island; at onboarding each restaurant will
 * choose its own colors and brand images (stored in the restaurants.brand column, see supabase/migrations),
 * and these values will load from there. Mise's own orange is the default until a restaurant picks its colors.
 */
export const restaurant = {
  name: 'Pearl Island',
  /** Chosen at onboarding. null = use the platform default theme. */
  brand: null as null | { accent: string; images: string[] },
} as const
