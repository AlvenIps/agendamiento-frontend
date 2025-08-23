# ---FASE 1 Compilación con Node.js
FROM node:20-alpine AS build-stage
WORKDIR /app
LABEL authors="jose"
# copiamos dependencias y instalamos
COPY package*.json ./
RUN npm install
# copia el codigo fuente y contruye app para prod.
COPY . .
RUN npm run build

# --- FASE 2 Produccion
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
#elimina codigo por defecto
RUN rm -rf ./*
# copiamos archivos ya compilados
COPY --from=build-stage /app/dist .
#copiamos nuestra conf Nginx para el router de Vue
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80