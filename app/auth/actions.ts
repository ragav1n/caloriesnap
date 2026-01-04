'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { AuthSchema } from '@/lib/schemas'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
    }

    const validation = AuthSchema.safeParse(rawData)
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { email, password } = validation.data

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
    }

    const validation = AuthSchema.safeParse(rawData)
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { email, password } = validation.data

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Login immediately after signup if auto-confirm is enabled, or redirect to Login with message
    // Assuming auto-confirm for simplicity in dev, or redirecting to dashboard if session is created

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        revalidatePath('/', 'layout')
        redirect('/')
    } else {
        // Email confirmation required
        return { success: 'Check your email to continue sign in process' }
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
