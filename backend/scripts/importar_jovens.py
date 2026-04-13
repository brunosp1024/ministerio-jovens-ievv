import sys
import os
import asyncio
import csv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.services.jovem_service import JovemService
from app.schemas.jovem import JovemCreate
from app.utils.generic import parse_bool, parse_date


async def importar_jovens(file_path):
    if not file_path.endswith(".csv"):
        print("Apenas arquivos CSV são suportados.")
        return

    # Configura o banco de dados
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    ignoreds = 0
    async with AsyncSessionLocal() as db:
        service = JovemService(db)
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                nome = row.get("Nome")
                email = row.get("E-mail")
                telefone = row.get("Telefone")
                data_nascimento = parse_date(row.get("Data de Nascimento"))
                endereco = row.get("Endereço")
                financeiro = parse_bool(row.get("Financeiro"))
                status = parse_bool(row.get("Status"))

                # Verifica se já existe jovem com mesmo nome, email ou telefone
                result = await db.execute(
                    text(
                        "SELECT nome, email, telefone FROM jovens WHERE nome = :nome OR email = :email OR telefone = :telefone LIMIT 1"
                    ),
                    {"nome": nome, "email": email, "telefone": telefone}
                )
                conflict = result.first()
                if conflict:
                    print(f"Ignorado: {nome} (conflito com nome, email ou telefone já cadastrado)")
                    ignoreds += 1
                    continue

                jovem = JovemCreate(
                    nome=nome,
                    email=email,
                    telefone=telefone,
                    data_nascimento=data_nascimento,
                    endereco=endereco,
                    habilitado_financeiro=financeiro,
                    ativo=status,
                )
                await service.create(jovem)
                count += 1
    print(f"\n ### Importação concluída ###")
    print(f"- Cadastrados: {count} jovens.")
    if ignoreds > 0:
        print(f"- Ignorados: {ignoreds} jovens.")

def main():
    if len(sys.argv) < 2:
        print("Uso: python importar_jovens.py <arquivo.csv>")
        sys.exit(1)
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Arquivo não encontrado: {file_path}")
        sys.exit(1)
    asyncio.run(importar_jovens(file_path))

if __name__ == "__main__":
    main()
