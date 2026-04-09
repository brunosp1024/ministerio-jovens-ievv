#!/bin/bash
set -euo pipefail

# =============================================================================
# Script de setup para servidor Oracle Cloud (Ubuntu/ARM64)
# Uso: ssh ubuntu@IP 'bash -s' < scripts/setup-server.sh
# =============================================================================

echo "=== Atualizando sistema ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== Criando swap de 2GB ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl vm.swappiness=10
fi

echo "=== Instalando Docker ==="
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

echo "=== Instalando Docker Compose plugin ==="
sudo apt-get install -y docker-compose-plugin

echo "=== Instalando utilitários de persistência do firewall ==="
sudo apt-get install -y iptables-persistent

echo "=== Abrindo portas no firewall (iptables) ==="
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo "=== Criando diretório da aplicação ==="
sudo mkdir -p /opt/verbo-da-vida
sudo chown "$USER":"$USER" /opt/verbo-da-vida

echo ""
echo "========================================="
echo " Setup concluído!"
echo "========================================="
echo ""
echo "IMPORTANTE: Faça logout e login para o grupo docker funcionar:"
echo "  exit"
echo "  ssh ubuntu@<IP>"
echo ""
echo "Depois, siga os passos:"
echo "  cd /opt/verbo-da-vida"
echo "  git clone <repo-url> ."
echo "  cp .env.example .env"
echo "  nano .env   # preencha DOMAIN, senhas, etc."
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo ""
