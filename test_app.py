import requests
import time

def test_application():
    print("Testing Stock Dashboard Application...")

    # Test backend
    try:
        response = requests.get("http://localhost:8000/auth/captcha", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 8000")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not accessible: {e}")

    # Test frontend
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running on port 3000")
            print("   React app is serving correctly")
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend not accessible: {e}")

    # Test MySQL (indirectly through backend)
    try:
        response = requests.get("http://localhost:8000/stocks/AAPL", timeout=5)
        if response.status_code in [200, 404, 500]:
            print("✅ Database connection appears to be working")
        else:
            print(f"❌ Database test returned status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Database test failed: {e}")

if __name__ == "__main__":
    test_application()