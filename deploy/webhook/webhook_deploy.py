# Script FastAPI para receber webhook do GitHub e automatizar deploy
import os
from fastapi import FastAPI, Request, HTTPException, Header
import subprocess
import uvicorn
import hmac
import hashlib
from core.config import settings

app = FastAPI()

# Caminho do repositório relativo à raiz do projeto
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
BRANCH = 'main'

# Secret do webhook
env_secret = settings.WEBHOOK_SECRET
SECRET = env_secret.encode()

def verify_signature(request_body: bytes, signature_header: str):
    if not signature_header:
        return False
    sha_name, signature = signature_header.split('=')
    if sha_name != 'sha256':
        return False
    mac = hmac.new(SECRET, msg=request_body, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)

@app.post('/webhook')
async def webhook(request: Request, x_hub_signature_256: str = Header(None)):
    body = await request.body()
    if not verify_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature.")
    payload = await request.json()
    if payload.get('ref') == f'refs/heads/{BRANCH}':
        try:
            # Puxa as últimas alterações
            pull_output = subprocess.check_output([
                'bash', '-c',
                f'cd {REPO_DIR} && git pull origin {BRANCH}'
            ], stderr=subprocess.STDOUT)

            # Executa os testes
            test_output = subprocess.check_output([
                'bash', '-c',
                f'cd {REPO_DIR}/backend && docker compose -f ../docker-compose.prod.yml run --rm backend pytest'
            ], stderr=subprocess.STDOUT)

            # Faz o deploy
            deploy_output = subprocess.check_output([
                'bash', '-c',
                f'cd {REPO_DIR} && docker compose -f docker-compose.prod.yml up -d --build'
            ], stderr=subprocess.STDOUT)

            return {
                "status": "success",
                "output": pull_output.decode() + '\n' + test_output.decode() + '\n' + deploy_output.decode()
            }
        except subprocess.CalledProcessError as e:
            return {"status": "error", "output": e.output.decode()}
    return {"status": "ignored"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
