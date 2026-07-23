import requests

url = "https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/137877/scard"
headers = {
    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
    "x-rapidapi-key": "ac3cc52473msh7e21275bfb3de1bp17ac82jsn0a36b2907c63"
}
response = requests.get(url, headers=headers)
print(response.json())
