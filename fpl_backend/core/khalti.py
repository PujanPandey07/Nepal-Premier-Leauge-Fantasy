import requests
import os
from dotenv import load_dotenv
load_dotenv()

KHALTI_SECRET_KEY = os.getenv('KHALTI_SECRET_KEY')
KHALTI_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'


def initiate_payment(amount, transaction_id, user, return_url):
    # mock response simulating Khalti
    short_id = str(transaction_id)[:8]
    return {
        'pidx': f'mock_pidx_{short_id}',
        'payment_url': f'http://localhost:8000/api/payments/verify/?pidx=mock_pidx_{short_id}&status=Completed'
    }


def verify_payment(pidx):
    # mock response simulating Khalti verification
    return {
        'pidx': pidx,
        'status': 'Completed',
        'transaction_id': f'mock_txn_{pidx}',
        'total_amount': 10000
    }
