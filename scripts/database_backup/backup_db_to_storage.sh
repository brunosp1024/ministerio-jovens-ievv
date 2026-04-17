#!/bin/bash
# Script de backup semanal do banco PostgreSQL rodando em container Docker
# Salva o dump no Google Drive usando rclone

# Carrega variáveis do .env
set -o allexport
source "$(dirname "$0")/../../.env"
if [ $? -eq 0 ]; then
  echo "[OK] Variáveis de ambiente carregadas."
else
  echo "[ERRO] Falha ao carregar variáveis de ambiente (.env)." >&2
  exit 1
fi
set +o allexport

# Configurações vindas do .env ou valores padrão
CONTAINER_NAME="${POSTGRES_CONTAINER_NAME}"
DB_NAME="${POSTGRES_DB}"
DB_USER="${POSTGRES_USER}"
BACKUP_DIR="${BACKUP_DIR}"
RCLONE_REMOTE="${RCLONE_REMOTE}"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql.gz"

# Cria diretório de backup se não existir
mkdir -p "$BACKUP_DIR"
if [ $? -eq 0 ]; then
  echo "[OK] Diretório de backup pronto: $BACKUP_DIR"
else
  echo "[ERRO] Falha ao criar diretório de backup: $BACKUP_DIR" >&2
  exit 1
fi

# Dump do banco de dados
if docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"; then
  echo "[OK] Backup do banco realizado: $BACKUP_FILE"
else
  echo "[ERRO] Falha ao gerar backup do banco de dados." >&2
  exit 1
fi

# Envia para o Google Drive
if rclone copy "$BACKUP_FILE" "$RCLONE_REMOTE"; then
  echo "[OK] Backup enviado para o Google Drive: $RCLONE_REMOTE"
else
  echo "[ERRO] Falha ao enviar backup para o Google Drive." >&2
  exit 1
fi

# Remove todos os outros backups remotos, mantendo apenas o mais recente
REMOTE_PATH="$RCLONE_REMOTE"
LATEST_REMOTE_FILE=$(basename "$BACKUP_FILE")
if rclone lsf "$REMOTE_PATH" | grep -v "$LATEST_REMOTE_FILE" | while read file; do rclone deletefile "$REMOTE_PATH/$file"; done; then
  echo "[OK] Backups antigos removidos do Google Drive."
else
  echo "[ERRO] Falha ao remover backups antigos do Google Drive." >&2
fi

# (Opcional) Remove backups locais antigos (mantém 7 dias)
if find "$BACKUP_DIR" -type f -mtime +7 -delete; then
  echo "[OK] Backups locais antigos removidos."
else
  echo "[ERRO] Falha ao remover backups locais antigos." >&2
fi

# Manter apenas os 5 logs mais recentes
LOG_DIR="/opt/verbo-da-vida/scripts/database_backup/logs"
if ls -1t "$LOG_DIR"/backup_*.log | tail -n +6 | xargs -r rm --; then
  echo "[OK] Limpeza de logs antigos concluída."
else
  echo "[ERRO] Falha ao limpar logs antigos." >&2
fi

echo "[FINALIZADO] Backup realizado e enviado para o Google Drive com sucesso!"
