# Small, production-ish image. Works on plain Docker and OpenShift.
FROM node:20-slim

WORKDIR /app

# Install deps first so this layer is cached when only source changes.
COPY package.json ./
RUN npm install --omit=dev

# Copy the rest of the source.
COPY . .

# OpenShift runs containers as a random non-root UID by default.
# Running as a non-root user here keeps things compatible.
USER 1001

EXPOSE 3000

CMD ["node", "index.js"]
