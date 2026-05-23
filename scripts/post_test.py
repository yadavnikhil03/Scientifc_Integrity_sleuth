import httpx
import io

print('Posting fake image to http://localhost:8000/analyze')
file_content = b'fake image content for e2e test'
files = {'file': ('test.png', io.BytesIO(file_content), 'image/png')}

with httpx.Client() as client:
    try:
        r = client.post('http://localhost:8000/analyze', files=files, timeout=10.0)
        print('Status:', r.status_code)
        try:
            print('JSON:', r.json())
        except Exception as e:
            print('Failed to decode JSON:', e)
            print('Text:', r.text)
    except Exception as e:
        print('Request failed:', e)
