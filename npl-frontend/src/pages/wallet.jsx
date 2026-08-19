import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axiosInstance from '../utilis/axiosInstance'

export default function Wallet() {
    const [searchParams, setSearchParams] = useSearchParams()

    const [balance, setBalance] = useState(null)
    const [amount, setAmount] = useState('')
    const [loadingBalance, setLoadingBalance] = useState(true)
    const [initiating, setInitiating] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // ── Fetch current wallet balance on load ──
    const fetchBalance = async () => {
        setLoadingBalance(true)
        try {
            // NOTE: adjust this endpoint if your actual balance route differs
            const res = await axiosInstance.get('/api/wallet/')
            setBalance(res.data.wallet_balance)
        } catch (err) {
            console.error('Failed to fetch wallet balance:', err)
        } finally {
            setLoadingBalance(false)
        }
    }

    useEffect(() => {
        fetchBalance()
    }, [])

    // ── Handle redirect back from mock payment / verify view ──
    useEffect(() => {
        const status = searchParams.get('status')
        const reason = searchParams.get('reason')

        if (!status) return

        if (status === 'success') {
            setMessage('Payment successful! Your wallet has been topped up.')
            fetchBalance()
        } else if (status === 'cancelled') {
            setMessage(
                reason === 'expired'
                    ? 'Payment session expired. Please try again.'
                    : 'Payment cancelled.'
            )
        } else if (status === 'failed') {
            const reasonText = {
                missing_pidx: 'Payment reference was missing.',
                transaction_not_found: 'Transaction could not be found.',
                expired: 'Payment session expired.',
            }
            setError(reasonText[reason] || 'Payment failed. Please try again.')
        }

        // Clear query params so refreshing the page doesn't re-trigger the message
        setSearchParams({}, { replace: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Initiate a new top-up ──
    const handleTopUp = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        const nprAmount = Number(amount)

        if (!amount || isNaN(nprAmount) || nprAmount <= 0) {
            setError('Please enter a valid amount.')
            return
        }

        if (nprAmount < 10) {
            setError('Minimum top-up amount is Rs 10.')
            return
        }

        setInitiating(true)

        try {
            const res = await axiosInstance.post('/api/payments/initiate/', {
                amount: nprAmount,
            })

            const paymentUrl = res.data.payment_url

            if (!paymentUrl) {
                setError('Could not start payment. Please try again.')
                setInitiating(false)
                return
            }

            // Redirect browser to the mock Khalti payment page
            window.location.href = paymentUrl

        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Something went wrong. Please try again.')
            setInitiating(false)
        }
    }

    return (
        <div className="flex min-h-screen items-start justify-center bg-gray-100 p-4 pt-16">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg">

                {/* Header */}
                <div className="bg-purple-600 px-6 py-5">
                    <p className="text-lg font-bold text-white">My Wallet</p>
                    <p className="text-xs text-purple-200">NPL Fantasy Cricket</p>
                </div>

                <div className="p-6">

                    {/* Balance */}
                    <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                        <p className="mb-1 text-xs text-gray-500">Current Balance</p>
                        <p className="text-3xl font-bold text-gray-800">
                            {loadingBalance
                                ? '...'
                                : `NPR ${Number(balance ?? 0).toFixed(2)}`}
                        </p>
                    </div>

                    {/* Status messages from redirect */}
                    {message && (
                        <p className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
                            {message}
                        </p>
                    )}
                    {error && (
                        <p className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    {/* Top-up form */}
                    <form onSubmit={handleTopUp}>
                        <label className="mb-2 block text-xs font-medium text-gray-500">
                            Add Money (NPR)
                        </label>
                        <input
                            type="number"
                            min="10"
                            step="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            disabled={initiating}
                            className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none disabled:opacity-50"
                        />

                        <button
                            type="submit"
                            disabled={initiating}
                            className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                        >
                            {initiating ? 'Redirecting...' : 'Add Money'}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    )
}