FROM node:22-alpine AS build

ARG NPM_REGISTRY=https://registry.npmjs.org/

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --registry="$NPM_REGISTRY"
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
