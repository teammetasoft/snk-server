FROM node:22 AS build-env

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

FROM gcr.io/distroless/nodejs22-debian12

COPY --from=build-env /app /app

WORKDIR /app

USER nonroot:nonroot

EXPOSE 4000

CMD ["app.js"]
