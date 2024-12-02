import { createContext, useContext, useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_your_key'
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

interface SubscriptionTier {
  name: 'free' | 'premium'
  limits: {
    playlists: number
    songs: number
  }
}

export const SUBSCRIPTION_TIERS: Record<'free' | 'premium', SubscriptionTier> = {
  free: {
    name: 'free',
    limits: {
      playlists: 10,
      songs: 100
    }
  },
  premium: {
    name: 'premium',
    limits: {
      playlists: Infinity,
      songs: Infinity
    }
  }
}

interface Usage {
  playlistCount: number
  songCount: number
}

interface SubscriptionContextType {
  tier: 'free' | 'premium'
  usage: Usage
  isLoading: boolean
  error: string | null
  upgradeToPremium: () => Promise<void>
  canCreatePlaylist: boolean
  canAddSong: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [usage, setUsage] = useState<Usage>({ playlistCount: 0, songCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchSubscriptionStatus(),
        fetchUsage()
      ]).finally(() => {
        setIsLoading(false)
      })
    } else {
      setTier('free')
      setUsage({ playlistCount: 0, songCount: 0 })
      setIsLoading(false)
    }
  }, [user])

  const fetchSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) throw error

      setTier(data?.tier || 'free')
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to fetch subscription status')
      setTier('free')
    }
  }

  const fetchUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_usage')
        .select('playlist_count, song_count')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) throw error

      setUsage({
        playlistCount: data?.playlist_count || 0,
        songCount: data?.song_count || 0
      })
    } catch (err) {
      console.error('Error fetching usage:', err)
      setError('Failed to fetch usage data')
      setUsage({ playlistCount: 0, songCount: 0 })
    }
  }

  const upgradeToPremium = async () => {
    if (!user) {
      throw new Error('Must be logged in to upgrade')
    }

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize')
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const { sessionId } = await response.json()

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Error upgrading to premium:', err)
      throw new Error('Failed to start upgrade process')
    }
  }

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        usage,
        isLoading,
        error,
        upgradeToPremium,
        canCreatePlaylist: tier === 'premium' || usage.playlistCount < SUBSCRIPTION_TIERS.free.limits.playlists,
        canAddSong: tier === 'premium' || usage.songCount < SUBSCRIPTION_TIERS.free.limits.songs
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}