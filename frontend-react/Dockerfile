FROM node:20-alpine AS build

WORKDIR /app/frontend-react

COPY frontend-react/package*.json ./
RUN npm ci

COPY frontend-react .
ENV VITE_API_BASE_URL=/api
RUN npm run build


FROM nginx:1.27-alpine

COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend-react/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]