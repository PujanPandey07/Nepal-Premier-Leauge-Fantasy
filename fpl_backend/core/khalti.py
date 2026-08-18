from django.conf import settings


def initiate_payment(amount, transaction_id, user, return_url):
    """
    Mock Khalti initiation.

    `amount` is received in paisa because the real gateway
    would receive paisa.
    """

    short_id = str(transaction_id)[:8]
    pidx = f'mock_pidx_{short_id}'

    frontend_base = getattr(
        settings,
        'FRONTEND_URL',
        'http://localhost:5173'
    ).rstrip('/')

    return {
        'pidx': pidx,
        'payment_url': (
            f'{frontend_base}/mock-payment'
            f'?pidx={pidx}'
            f'&amount={amount}'
        )
    }


def verify_payment(pidx):
    """
    Mock verification.

    Every payment submitted through the mock payment page
    is considered successful.
    """

    return {
        'pidx': pidx,
        'status': 'Completed',
        'transaction_id': f'mock_txn_{pidx}',
    }
