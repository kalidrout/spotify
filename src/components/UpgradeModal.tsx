import { Crown, X } from 'lucide-react'
import { useSubscription, SUBSCRIPTION_TIERS } from '../contexts/SubscriptionContext'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'playlists' | 'songs'
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const { upgradeToPremium } = useSubscription()

  if (!isOpen) return null

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium()
    } catch (err) {
      console.error('Failed to upgrade:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade to Premium
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          {reason === 'playlists' ? (
            <p className="text-gray-300">
              You've reached the limit of {SUBSCRIPTION_TIERS.free.limits.playlists} playlists on the free tier.
            </p>
          ) : reason === 'songs' ? (
            <p className="text-gray-300">
              You've reached the limit of {SUBSCRIPTION_TIERS.free.limits.songs} songs on the free tier.
            </p>
          ) : (
            <p className="text-gray-300">
              Upgrade to Premium for unlimited access to all features!
            </p>
          )}
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Premium Features</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-gray-300">
              <Crown className="w-5 h-5 text-yellow-500" />
              Unlimited playlists
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Crown className="w-5 h-5 text-yellow-500" />
              Unlimited songs
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Crown className="w-5 h-5 text-yellow-500" />
              Higher quality audio
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Crown className="w-5 h-5 text-yellow-500" />
              No ads
            </li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full py-3 px-4 hover:from-yellow-600 hover:to-yellow-700 font-semibold"
          >
            Upgrade Now - $9.99/month
          </button>
          <p className="text-gray-400 text-sm mt-4">
            Cancel anytime. No commitments.
          </p>
        </div>
      </div>
    </div>
  )
}