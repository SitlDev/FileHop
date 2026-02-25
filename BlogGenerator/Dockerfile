# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/webapp
COPY webapp/package*.json ./
RUN npm install
COPY webapp/ ./
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/webapp/dist ./webapp/dist

# Ensure start script is executable
RUN chmod +x start.sh

# Expose port (Railway sets $PORT)
EXPOSE 5000

# Start application using the shell script
CMD ["./start.sh"]
