import httpx
from app.config import settings


async def send_sms_otp(phone: str, otp: str) -> bool:
    if settings.MSG91_AUTH_KEY and settings.MSG91_TEMPLATE_ID:
        # MSG91 Send OTP API
        # Phone must be in E.164 without '+' for MSG91 (e.g. 919876543210)
        mobile = phone.lstrip("+")
        url = "https://control.msg91.com/api/v5/otp"
        params = {
            "template_id": settings.MSG91_TEMPLATE_ID,
            "mobile": mobile,
            "authkey": settings.MSG91_AUTH_KEY,
            "otp": otp,
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, params=params)
                data = response.json()
                if data.get("type") == "success":
                    return True
                print(f"MSG91 error: {data}")
                return False
        except Exception as e:
            print(f"Exception sending SMS via MSG91: {e}")
            return False

    # Development fallback — log OTP to console
    print("\n" + "=" * 60)
    print(f"[SMS MOCK] To: {phone}")
    print(f"OTP: {otp}")
    print("=" * 60 + "\n")
    return True
