# Dockerfile para PastoriniAPI no Render
FROM node:18-alpine

WORKDIR /app

# Instala dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copia arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instala dependências
RUN npm ci --only=production

# Copia código fonte
COPY . .

# Build (se necessário)
RUN npm run build || true

# Expõe porta
EXPOSE 3000

# Comando de start
CMD ["npm", "run", "server"]

