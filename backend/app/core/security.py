import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from app.core.config import settings


def _encode_payload(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _decode_payload(encoded_payload: str) -> dict:
    padding = "=" * (-len(encoded_payload) % 4)
    raw = base64.urlsafe_b64decode(f"{encoded_payload}{padding}".encode())
    return json.loads(raw.decode())


def _sign(encoded_payload: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(),
        encoded_payload.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_credentials(username: str, password: str) -> bool:
    if hmac.compare_digest(username, settings.ADMIN_USERNAME) and hmac.compare_digest(password, settings.ADMIN_PASSWORD):
        return "admin"
    if hmac.compare_digest(username, settings.VIEWER_USERNAME) and hmac.compare_digest(password, settings.VIEWER_PASSWORD):
        return "viewer"
    return None


def create_access_token(username: str) -> str:
    if username == settings.ADMIN_USERNAME:
        role = "admin"
    elif username == settings.VIEWER_USERNAME:
        role = "viewer"
    else:
        role = "user"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": username,
        "role": role,
        "exp": int(expires_at.timestamp()),
    }
    encoded_payload = _encode_payload(payload)
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def decode_access_token(token: str) -> str | None:
    try:
        encoded_payload, signature = token.split(".", maxsplit=1)
    except ValueError:
        return None

    expected_signature = _sign(encoded_payload)
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        payload = _decode_payload(encoded_payload)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None

    expires_at = payload.get("exp")
    username = payload.get("sub")
    role = payload.get("role", "user")
    if not isinstance(expires_at, int) or not isinstance(username, str):
        return None

    if datetime.now(timezone.utc).timestamp() > expires_at:
        return None

    return {"username": username, "role": role}