// Wallet.jsx
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
            <p className="p-8">Loading...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto p-8">
                <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

                {/* Payment status messages — shown after redirect from mock Khalti */}
                {paymentStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-700 font-medium">
                        ✓ Payment successful! Your wallet has been topped up.
                    </div>
                )}
                {paymentStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 font-medium">
                        ✗ Payment failed. Please try again.
                    </div>
                )}
                {paymentStatus === 'cancelled' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-yellow-700 font-medium">
                        Payment cancelled.
                    </div>
                )}

                {/* Balance card */}
                <div className="bg-slate-900 text-white rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                    <p className="text-4xl font-bold">
                        NPR {Number(balance).toFixed(2)}
                    </p>
                </div>

                {/* Top up section */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                    <h2 className="font-semibold mb-3">Top Up Wallet</h2>
                    {error && (
                        <p className="text-red-500 text-sm mb-3">{error}</p>
                    )}
                    <div className="flex gap-3">
                        <input
                            type="number"
                            placeholder="Enter amount (NPR)"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="1"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleTopUp}
                            disabled={paying}
                            className="bg-purple-600 text-white px-5 py-2 rounded font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                            {paying ? 'Redirecting...' : 'Pay with Khalti'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        You will be redirected to Khalti to complete the payment.
                    </p>
                </div>

                {/* Transaction history */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold">Transaction History</h2>
                    </div>

                    {transactions.length === 0 ? (
                        <p className="text-gray-500 text-sm p-4">No transactions yet.</p>
                    ) : (
                        transactions.map(tx => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium capitalize">
                                        {tx.type === 'credit' ? '+ Top Up' : '- League Entry'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {tx.payment_method} · {new Date(tx.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                        {tx.type === 'credit' ? '+' : '-'} NPR {Number(tx.amount).toFixed(2)}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${
                                        tx.status === 'completed' ? 'text-green-500' :
                                        tx.status === 'failed' ? 'text-red-400' : 'text-yellow-500'
                                    }`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-between mt-4">
                    <button
                        disabled={!prevPage}
                        onClick={() => goToPage(prevPage)}
                        className="disabled:opacity-30 text-sm"
                    >
                        Previous
                    </button>
                    <button
                        disabled={!nextPage}
                        onClick={() => goToPage(nextPage)}
                        className="disabled:opacity-30 text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}