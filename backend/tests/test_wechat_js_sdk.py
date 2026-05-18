from fastapi.testclient import TestClient

from app.main import app


def test_wechat_js_sdk_signature_skips_when_not_configured() -> None:
    client = TestClient(app)

    response = client.get(
        "/api/wechat/js-sdk-signature",
        params={"url": "https://example.com/i/demo-token"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["enabled"] is False
    assert payload["reason"] == "wechat_mp_app_id_or_secret_missing"
    assert payload["title"]
