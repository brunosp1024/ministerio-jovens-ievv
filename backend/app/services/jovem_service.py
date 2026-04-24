from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models.jovem import Jovem
from app.schemas.jovem import JovemCreate, JovemUpdate
from app.services.whatsapp_service import WhatsAppService
from app.services.cloudinary_service import CloudinaryService


class JovemService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100, ativo: Optional[bool] = None) -> List[Jovem]:
        query = select(Jovem)
        if ativo is not None:
            query = query.where(Jovem.ativo == ativo)
        query = query.offset(skip).limit(limit).order_by(Jovem.nome)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, jovem_id: int) -> Optional[Jovem]:
        result = await self.db.execute(select(Jovem).where(Jovem.id == jovem_id))
        return result.scalar_one_or_none()

    async def get_habilitados_financeiro(self) -> List[Jovem]:
        result = await self.db.execute(
            select(Jovem).where(Jovem.habilitado_financeiro == True, Jovem.ativo == True).order_by(Jovem.nome)
        )
        return list(result.scalars().all())

    async def create(self, data: JovemCreate) -> Jovem:
        jovem = Jovem(**data.model_dump())
        img_url = None
        telefone = f"55{jovem.telefone}"

        if telefone:
            whatsapp_service = WhatsAppService()
            profile_image = await whatsapp_service.get_profile_picture_url(telefone)
            # Salva no cloudnary
            img_url = CloudinaryService.upload_image(profile_image, public_id=f"jovens-ievv/{jovem.telefone}")

        jovem.foto_url = img_url
        self.db.add(jovem)
        await self.db.commit()
        await self.db.refresh(jovem)
        return jovem

    async def update(self, jovem_id: int, data: JovemUpdate) -> Optional[Jovem]:
        jovem = await self.get_by_id(jovem_id)
        if not jovem:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(jovem, field, value)
        await self.db.commit()
        await self.db.refresh(jovem)
        return jovem

    async def delete(self, jovem_id: int) -> bool:
        jovem = await self.get_by_id(jovem_id)
        if not jovem:
            return False
        await self.db.delete(jovem)
        await self.db.commit()
        return True

    async def get_aniversariantes_hoje(self) -> List[Jovem]:
        from datetime import date
        hoje = date.today()
        result = await self.db.execute(
            select(Jovem).where(
                Jovem.ativo == True,
                Jovem.data_nascimento != None,
            )
        )
        todos = list(result.scalars().all())
        return [j for j in todos if j.data_nascimento.month == hoje.month and j.data_nascimento.day == hoje.day]
