'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type GoalType = 'weight_loss' | 'muscle_gain' | 'strength' | 'sport_specific'
type ModeType = 'dynamic' | 'fixed_split' | 'template'

export type OnboardingData = {
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  gender: string | null
  goal: GoalType
  equipment: string[]
  frequency_preference: number
  intensity_preference: number
  duration_preference: number
  mode_preference: ModeType
}

export async function saveOnboarding(data: OnboardingData): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'Not authenticated'

    const admin = createAdminClient()
    const { error } = await admin.from('users').upsert(
      {
        id: user.id,
        ...data,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) return `Save failed: ${error.message}`
    return null
  } catch (e) {
    return `Unexpected error: ${String(e)}`
  }
}
