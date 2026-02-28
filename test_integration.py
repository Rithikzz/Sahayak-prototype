import httpx
import asyncio
import json

BASE_URL = "http://localhost:5000/api"

async def test_end_to_end_flow():
    print("Starting E2E Backend Tests...")
    
    async with httpx.AsyncClient() as client:
        # 1. Test Fetching Dynamic Forms
        print("\n--- Testing GET /forms/templates ---")
        try:
            res = await client.get(f"{BASE_URL}/forms/templates")
            if res.status_code == 200:
                data = res.json()
                print(f"✅ Success! Fetched {len(data.keys())} form templates.")
                print(f"Sample keys: {list(data.keys())[:3]}")
            else:
                print(f"❌ Failed to fetch forms. Status: {res.status_code}")
                return
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return
            
        # 2. Test Staff Login
        print("\n--- Testing POST /auth/staff-login ---")
        try:
            res = await client.post(f"{BASE_URL}/auth/staff-login", json={"pin": "1234"})
            if res.status_code == 200:
                data = res.json()
                token = data.get("access_token")
                print(f"✅ Success! Logged in as: {data.get('staff_name')}")
                print(f"Token received: {token[:20]}...")
            else:
                print(f"❌ Failed to login. Status: {res.status_code}, Response: {res.text}")
                return
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return
            
        # 3. Test Form Submission
        print("\n--- Testing POST /forms/submit ---")
        submission_payload = {
            "service_type": "deposit",
            "form_data": {
                "accountNumber": "98765432101",
                "amount": "1500",
                "depositorName": "John Test",
                "phoneNumber": "5551234567"
            },
            "staff_pin": "1234",
            "account_number": "98765432101"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            res = await client.post(
                f"{BASE_URL}/forms/submit", 
                json=submission_payload,
                headers=headers
            )
            
            if res.status_code == 200:
                data = res.json()
                print(f"✅ Success! Form submitted. DB ID: {data.get('submission_id')}")
                print(f"Response: {data}")
            else:
                print(f"❌ Failed to submit form. Status: {res.status_code}, Response: {res.text}")
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return

        # 4. Test TTS
        print("\n--- Testing POST /voice/synthesize ---")
        try:
            res = await client.post(
                f"{BASE_URL}/voice/synthesize", 
                data={"text": "Hello world", "lang": "en"}
            )
            
            if res.status_code == 200:
                print(f"✅ Success! TTS generated audio blob of size: {len(res.content)} bytes.")
            else:
                print(f"❌ Failed to synthesize TTS. Status: {res.status_code}, Response: {res.text}")
        except Exception as e:
            print(f"❌ Connection error: {e}")
            
        # 5. Test STT
        print("\n--- Testing POST /voice/transcribe ---")
        try:
            # We must pass the audio we just got from TTS as the test input to STT
            if 'res' in locals() and res.status_code == 200:
                print("Using synthesized TTS audio as input to STT...")
                files = {'audio': ('hello.mp3', res.content, 'audio/mpeg')}
                res_stt = await client.post(f"{BASE_URL}/voice/transcribe", files=files)
                if res_stt.status_code == 200:
                    data = res_stt.json()
                    print(f"✅ Success! STT transcribed text: '{data.get('text')}'")
                else:
                    print(f"❌ Failed to transcribe STT. Status: {res_stt.status_code}, Response: {res_stt.text}")
            else:
                print("Skipping STT as TTS failed.")
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_end_to_end_flow())
