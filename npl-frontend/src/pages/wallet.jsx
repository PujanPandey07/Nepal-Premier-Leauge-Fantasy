import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../utilis/axiosInstance'
import Navbar from '../components/navbar'

export default function Wallet() {
    const [balance, setBalance] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState(null)

    // Read payment status from URL params — set after Khalti redirect
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('status')

    useEffect(() => {
        Promise.all([
            axiosInstance.get('/api/users/me/'),
            axiosInstance.get('/api/transactions/'),
        ])
            .then(([userRes, txRes]) => {
                setBalance(userRes.data.wallet_balance)
                setTransactions(txRes.data.results || txRes.data)
                setNextPage(txRes.data.next)
                setPrevPage(txRes.data.previous)
            })
            .catch(err => console.error('Error loading wallet:', err))
            .finally(() => setLoading(false))
    }, [])

    const goToPage = (url) => {
        if (!url) return
        axiosInstance.get(url)
            .then(res => {
                setTransactions(res.data.results || res.data)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(err => console.error('Error fetching transactions:', err))
    }

    const handleTopUp = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }
        setPaying(true)
        setError(null)

        try {
            const res = await axiosInstance.post('/api/payments/initiate/', {
                // Khalti expects amount in paisa (1 NPR = 100 paisa)
                amount: Number(amount) * 100,
            })
            // Redirect to mock Khalti payment page
            window.location.href = res.data.payment_url
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to initiate payment')
            setPaying(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex h-[60vh] items-center justify-center p-4">
                <div className="flex items-center gap-3 text-slate-500 font-medium text-xs sm:text-sm">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    Loading wallet data...
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">My Wallet</h1>

                {/* Payment status messages — shown after redirect from mock Khalti */}
                {paymentStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 sm:p-4 mb-4 text-xs sm:text-sm text-green-700 font-medium flex items-center gap-2">
                        <span>✓</span> Payment successful! Your wallet has been topped up.
                    </div>
                )}
                {paymentStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 sm:p-4 mb-4 text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2">
                        <span>✕</span> Payment failed. Please try again.
                    </div>
                )}
                {paymentStatus === 'cancelled' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 sm:p-4 mb-4 text-xs sm:text-sm text-yellow-700 font-medium flex items-center gap-2">
                        <span>!</span> Payment cancelled.
                    </div>
                )}

                {/* Balance card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-md border border-slate-800">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1 font-medium uppercase tracking-wider">Current Balance</p>
                    <p className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                        NPR {Number(balance || 0).toFixed(2)}
                    </p>
                </div>

                {/* Top up section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-5 sm:mb-6 shadow-sm">
                    <h2 className="font-bold text-sm sm:text-base text-gray-800 mb-3">Top Up Wallet</h2>
                    {error && (
                        <p className="text-red-500 text-xs sm:text-sm mb-3 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                        <input
                            type="number"
                            placeholder="Enter amount (NPR)"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="1"
                            className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                        />
                        <button
                            onClick={handleTopUp}
                            disabled={paying}
                            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap active:scale-[0.98]"
                        >
                            {paying ? 'Redirecting...' : 'Pay with Khalti'}
                        </button>
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-2.5">
                        You will be redirected to Khalti to complete the payment.
                    </p>
                </div>

                {/* Transaction history */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-sm sm:text-base text-gray-800">Transaction History</h2>
                    </div>

                    {transactions.length === 0 ? (
                        <p className="text-gray-500 text-xs sm:text-sm p-4 sm:p-6 text-center">No transactions yet.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {transactions.map(tx => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3.5 sm:p-4 gap-3 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize truncate">
                                            {tx.type === 'credit' ? '+ Top Up' : '- League Entry'}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
                                            {tx.payment_method} · {new Date(tx.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-xs sm:text-sm font-bold ${
                                            tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                                        }`}>
                                            {tx.type === 'credit' ? '+' : '-'} NPR {Number(tx.amount).toFixed(2)}
                                        </p>
                                        <p className={`text-[10px] sm:text-xs font-semibold capitalize mt-0.5 ${
                                            tx.status === 'completed' ? 'text-emerald-500' :
                                            tx.status === 'failed' ? 'text-red-400' : 'text-amber-500'
                                        }`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4 sm:mt-6 gap-2">
                    <button
                        disabled={!prevPage}
                        onClick={() => goToPage(prevPage)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                    >
                        ← Previous
                    </button>
                    <button
                        disabled={!nextPage}
                        onClick={() => goToPage(nextPage)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    )
}