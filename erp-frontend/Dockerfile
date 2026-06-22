# ===== Stage 1: build =====
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências (camada cacheada enquanto o package-lock não mudar)
COPY package*.json ./
RUN npm ci

# A URL da API é "assada" no bundle em tempo de build (Vite).
# Relativa por padrão: o nginx do front faz proxy de /api -> backend (mesma origem),
# o que faz o app funcionar pelo celular sem depender de "localhost".
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ===== Stage 2: serve (nginx) =====
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
