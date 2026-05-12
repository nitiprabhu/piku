import httpx
from app.config import settings


async def send_sms_otp(phone: str, otp: str) -> bool:
    """
    Sends an OTP SMS via Twilio if configured.
    Otherwise, mocks the delivery by printing to console.
    """
    message = f"Your ReelCraft OTP code is: {otp}. Valid for 5 minutes. Please do not share this code."

    # If Twilio is configured
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_SENDER_NUMBER:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        data = {
            "To": phone,
            "From": settings.TWILIO_SENDER_NUMBER,
            "Body": message,
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, auth=auth)
                if response.status_code in [200, 201]:
                    return True
                else:
                    print(f"Twilio error: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            print(f"Exception sending SMS: {e}")
            return False

    # Development Fallback
    print("\n" + "=" * 60)
    print(f"📱 [SMS MOCK] To: {phone}")
    print(f"💬 Message: {message}")
    print("=" * 60 + "\n")
    return True
