from django.conf import settings
import requests
import os
from dotenv import load_dotenv
load_dotenv

KHALTI_SECRET_KEY = os.getenv('KHALTI_SECRET_KEY')
KHALTI_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'


def initiate_payment(amount, transaction_id, user, return_url):
    short_id = str(transaction_id)[:8]
    pidx = f'mock_pidx_{short_id}'
    return {
        'pidx': pidx,
        # Point to our frontend mock payment page instead of verify directly
        'payment_url': f'http:{settings.frontend_url}/mock-payment?pidx={pidx}&amount={amount}'
    }


def verify_payment(pidx):
    # mock response simulating Khalti verification
    return {
        'pidx': pidx,
        'status': 'Completed',
        'transaction_id': f'mock_txn_{pidx}',
        'total_amount': 10000
    }
