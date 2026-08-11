// MockPayment.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../utilis/axiosInstance'

export default function MockPayment() {
    const navigate = useNavigate()
    const params = new URLSearchParams(window.location.search)
    const pidx = params.get('pidx')
    // amount comes in paisa — convert back to NPR for display
    const amountNPR = Number(params.get('amount')) / 100
    const [paying, setPaying] = useState(false)
    const [failed, setFailed] = useState(false)

   const handlePay = () => {
    setPaying(true)
    // Just redirect the browser to the verify URL —
    // the backend will process it and redirect to wallet?status=success
    window.location.href = `${API_BASE}/api/payments/verify/?pidx=${pidx}&status=Completed`
}

    const handleCancel = () => {
        navigate('/wallet?status=cancelled')
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">

                {/* Khalti-style purple header */}
                <div className="bg-purple-600 px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-black text-lg">K</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg">Khalti</p>
                        <p className="text-purple-200 text-xs">Digital Wallet & Payment</p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Merchant info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <p className="text-xs text-gray-500 mb-1">Paying to</p>
                        <p className="font-semibold text-gray-800">NPL Fantasy Cricket</p>
                        <p className="text-xs text-gray-400 mt-0.5">Wallet Top Up</p>
                    </div>

                    {/* Amount */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-3xl font-bold text-gray-800">
                            NPR {amountNPR.toFixed(2)}
                        </p>
                    </div>

                    {/* Mock bank/wallet options */}
                    <div className="space-y-2 mb-6">
                        <p className="text-xs text-gray-500 font-medium mb-2">Pay via</p>
                        {['Khalti Wallet', 'eBanking', 'Mobile Banking'].map((method, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                                    i === 0 ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    i === 0 ? 'border-purple-500' : 'border-gray-300'
                                }`}>
                                    {i === 0 && (
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-700">{method}</p>
                            </div>
                        ))}
                    </div>

                    {failed && (
                        <p className="text-red-500 text-sm text-center mb-3">
                            Payment failed. Please try again.
                        </p>
                    )}

                    {/* Pay button */}
                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 mb-3"
                    >
                        {paying ? 'Processing...' : `Pay NPR ${amountNPR.toFixed(2)}`}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="w-full border border-gray-300 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 text-sm"
                    >
                        Cancel
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        🔒 This is a simulated payment page for demo purposes
                    </p>
                </div>
            </div>
        </div>
    )
}