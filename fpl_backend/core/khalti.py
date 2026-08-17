from django.conf import settings


def initiate_payment(amount, transaction_id, user, return_url):
    short_id = str(transaction_id)[:8]
    pidx = f'mock_pidx_{short_id}'

    # Ensure URL formatting handles protocol correctly
    frontend_base = getattr(settings, 'FRONTEND_URL',
                            'http://localhost:5173').rstrip('/')

    return {
        'pidx': pidx,
        'payment_url': f'{frontend_base}/mock-payment?pidx={pidx}&amount={amount}'
    }


def verify_payment(pidx):
    return {
        'pidx': pidx,
        'status': 'Completed',
        'transaction_id': f'mock_txn_{pidx}',
        'total_amount': 1000
    }
