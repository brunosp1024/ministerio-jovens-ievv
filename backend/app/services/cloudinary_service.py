import httpx
import cloudinary
import cloudinary.uploader
import os


CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
cloudinary.config(cloudinary_url=CLOUDINARY_URL)

class CloudinaryService:

    @staticmethod
    def upload_image(image_source: bytes | str, public_id: str) -> str | None:
        """
        Faz upload de uma imagem para o Cloudinary.
        image_source pode ser bytes (conteúdo da imagem) ou uma URL (str).
        """
        try:
            if isinstance(image_source, str) and image_source.startswith("http"):
                resp = httpx.get(image_source)
                if resp.status_code == 200:
                    img_bytes = resp.content
                else:
                    print(f"Erro ao baixar imagem: {resp.status_code} {resp.text}")
                    return None

                result = cloudinary.uploader.upload(
                    img_bytes,
                    public_id=public_id,
                    resource_type="image"
                )
            else:
                result = cloudinary.uploader.upload(
                    image_source,
                    public_id=public_id,
                    resource_type="image"
                )
            return result.get("secure_url")
        except Exception as e:
            print(f"Erro ao enviar imagem para o Cloudinary: {e}")
            return None

    @staticmethod
    def delete_image(phone: str) -> bool:
        """
        Deleta uma imagem do Cloudinary pelo public_id.
        Retorna True se deletou, False caso contrário.
        """
        try:
            public_id = f"jovens-ievv/{phone}"
            result = cloudinary.uploader.destroy(public_id, resource_type="image")
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Erro ao deletar imagem do Cloudinary: {e}")
            return False
