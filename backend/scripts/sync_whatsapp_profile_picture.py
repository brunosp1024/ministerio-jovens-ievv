import os
import httpx
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.jovem import Jovem


# Configurações
EVOLUTION_API_URL = "https://evolution.64.181.189.97.nip.io"
EVOLUTION_API_KEY = os.getenv("AUTHENTICATION_API_KEY")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URI")

# Cloudinary
cloudinary.config(cloudinary_url=CLOUDINARY_URL)

# SQLAlchemy
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def get_whatsapp_profile_picture(phone: str) -> bytes | None:
    instance = os.getenv("EVOLUTION_INSTANCE_NAME")
    url = f"{EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/{instance}"
    headers = {"Content-Type": "application/json", "apikey": EVOLUTION_API_KEY}
    payload = {"number": f"+{phone}" if not phone.startswith("+") else phone}
    resp = httpx.post(url, headers=headers, json=payload)
    if resp.status_code == 200:
        data = resp.json()
        profile_url = data.get("profilePictureUrl")
        if profile_url and profile_url.startswith("http"):
            img_resp = httpx.get(profile_url)
            if img_resp.status_code == 200:
                return img_resp.content
            else:
                print(f"Erro ao baixar imagem: {img_resp.status_code} {img_resp.text}")
        else:
            print("URL de perfil inválida ou vazia.")
    else:
        print(f"Evolution API erro {resp.status_code}: {resp.text}")
    return None

def normalize_phone(phone: str) -> str:
    # Remove tudo que não for número
    digits = ''.join(filter(str.isdigit, phone))
    # Garante que começa com 55
    if not digits.startswith('55'):
        digits = '55' + digits.lstrip('0')
    return digits

def upload_to_cloudinary(image_bytes: bytes, public_id: str) -> str | None:
    result = cloudinary.uploader.upload(image_bytes, public_id=public_id, resource_type="image")
    return result.get("secure_url")

def main():
    jovens = session.query(Jovem).filter(Jovem.telefone != None).all()
    for jovem in jovens:
        print(f"Processando: {jovem.nome} - {jovem.telefone}")
        phone_norm = normalize_phone(jovem.telefone)
        img_bytes = get_whatsapp_profile_picture(phone_norm)
        if not img_bytes:
            print("Não foi possível obter a foto do WhatsApp.")
            continue
        url = upload_to_cloudinary(img_bytes, public_id=f"jovens-ievv/{phone_norm}")
        if url:
            jovem.foto_url = url
            session.commit()
            print(f"Foto salva: {url}")
        else:
            print("Falha ao enviar para o Cloudinary.")

if __name__ == "__main__":
    main()
