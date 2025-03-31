#FROM node:18-alpine
FROM alpine:latest
RUN apk add curl npm bash && \
    rm -rf /var/cache/apk/*
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]