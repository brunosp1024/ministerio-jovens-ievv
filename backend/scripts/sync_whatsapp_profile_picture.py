import os
import httpx
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.jovem import Jovem
from app.services.whatsapp_service import WhatsAppService
from app.services.cloudinary_service import CloudinaryService
import asyncio


# Configurações
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL")
EVOLUTION_API_KEY = os.getenv("AUTHENTICATION_API_KEY")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URI")

# SQLAlchemy
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

async def main():
    jovens = session.query(Jovem).filter(Jovem.telefone != None).all()
    whatsapp_service = WhatsAppService()
    for jovem in jovens:
        print(f"Processando: {jovem.nome} - {jovem.telefone}")
        img_url = await whatsapp_service.get_profile_picture_url(jovem.telefone)

        if not img_url:
            print("Não foi possível obter a foto do WhatsApp.")
            continue

        try:
            resp = httpx.get(img_url)
            if resp.status_code == 200:
                img_bytes = resp.content
            else:
                print(f"Erro ao baixar imagem: {resp.status_code} {resp.text}")
                continue
        except Exception as e:
            print(f"Erro ao baixar imagem: {e}")
            continue

        url = CloudinaryService.upload_image(img_bytes, public_id=f"jovens-ievv/{jovem.telefone}")
        if url:
            jovem.foto_url = url
            session.commit()
            print(f"Foto salva: {url}")
        else:
            print("Falha ao enviar para o Cloudinary.")

if __name__ == "__main__":
    asyncio.run(main())