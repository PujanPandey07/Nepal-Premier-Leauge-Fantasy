import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../utilis/axiosInstance'

export default function MockPayment() {
    const navigate = useNavigate()

    const params = new URLSearchParams(window.location.search)

    const pidx = params.get('pidx')
    const rawAmount = params.get('amount')

    // Amount in the URL is paisa.
    const amountNPR = rawAmount
        ? Number(rawAmount) / 100
        : 0

    const [paying, setPaying] = useState(false)
    const [failed, setFailed] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState(0)

    const apiBaseUrl =
        axiosInstance.defaults.baseURL || ''

    const handlePay = () => {
        if (!pidx) {
            setFailed(true)
            return
        }

        setPaying(true)

        const verifyEndpoint =
            `/api/payments/verify/?pidx=${encodeURIComponent(pidx)}`

        const fullUrl = apiBaseUrl
            ? `${apiBaseUrl.replace(/\/$/, '')}${verifyEndpoint}`
            : verifyEndpoint

        window.location.href = fullUrl
    }

    const handleCancel = () => {
        navigate('/wallet?status=cancelled')
    }

    // Auto-cancel the mock payment UI after 2 minutes.
    useEffect(() => {
        if (!pidx) return

        const timer = setTimeout(() => {
            navigate('/wallet?status=cancelled&reason=expired')
        }, 120000)

        return () => clearTimeout(timer)
    }, [pidx, navigate])

    if (!pidx || isNaN(amountNPR) || amountNPR <= 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">

                    <p className="mb-1 font-semibold text-red-600">
                        Invalid Payment Parameters
                    </p>

                    <p className="mb-5 text-xs text-gray-500">
                        Missing or invalid transaction credentials.
                    </p>

                    <button
                        onClick={handleCancel}
                        className="w-full rounded-xl bg-gray-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-900"
                    >
                        Return to Wallet
                    </button>

                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">

            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg">

                {/* Header */}
                <div className="flex items-center gap-3 bg-purple-600 px-6 py-5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className="text-lg font-black text-purple-600">
                            K
                        </span>
                    </div>

                    <div>
                        <p className="text-lg font-bold leading-tight text-white">
                            Khalti
                        </p>

                        <p className="text-xs text-purple-200">
                            Digital Wallet & Payment
                        </p>
                    </div>

                </div>

                <div className="p-6">

                    {/* Merchant */}
                    <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">

                        <p className="mb-0.5 text-xs text-gray-500">
                            Paying to
                        </p>

                        <p className="font-semibold text-gray-800">
                            NPL Fantasy Cricket
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                            Wallet Top Up
                        </p>

                    </div>

                    {/* Amount */}
                    <div className="mb-6 text-center">

                        <p className="mb-1 text-xs text-gray-500">
                            Total Amount
                        </p>

                        <p className="text-3xl font-bold text-gray-800">
                            NPR {amountNPR.toFixed(2)}
                        </p>

                    </div>

                    {/* Payment methods */}
                    <div className="mb-6 space-y-2">

                        <p className="mb-2 text-xs font-medium text-gray-500">
                            Pay via
                        </p>

                        {[
                            'Khalti Wallet',
                            'eBanking',
                            'Mobile Banking'
                        ].map((method, i) => (

                            <div
                                key={method}
                                onClick={() => setSelectedMethod(i)}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                    selectedMethod === i
                                        ? 'border-purple-500 bg-purple-50/50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >

                                <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                        selectedMethod === i
                                            ? 'border-purple-500'
                                            : 'border-gray-300'
                                    }`}
                                >
                                    {selectedMethod === i && (
                                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    )}
                                </div>

                                <p className="text-sm font-medium text-gray-700">
                                    {method}
                                </p>

                            </div>

                        ))}

                    </div>

                    {failed && (
                        <p className="mb-3 text-center text-xs text-red-500">
                            Payment verification failed. Please try again or cancel.
                        </p>
                    )}

                    {/* Pay */}
                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="mb-3 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                        {paying
                            ? 'Processing...'
                            : `Pay NPR ${amountNPR.toFixed(2)}`}
                    </button>

                    {/* Cancel */}
                    <button
                        onClick={handleCancel}
                        disabled={paying}
                        className="w-full rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        🔒 Simulated payment environment for testing
                    </p>

                </div>

            </div>

        </div>
    )
}