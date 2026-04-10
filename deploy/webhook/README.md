# Documentação do Webhook de Deploy

Esta pasta contém os arquivos necessários para automação de deploy via webhook do GitHub.

- webhook_deploy.py: Script FastAPI que recebe o webhook e executa o deploy.
- Dockerfile: Containeriza o serviço de webhook.

Como usar:
1. Configure o .env na raiz do projeto com a variável WEBHOOK_SECRET.
2. Faça build da imagem Docker:
   docker build -f deploy/webhook/Dockerfile -t webhook-deploy .
3. Rode o container:
   docker run -d --env-file .env -v $(pwd):/app -p 5000:5000 webhook-deploy

Ajuste volumes, portas e variáveis conforme necessário.
