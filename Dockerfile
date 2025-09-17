FROM node:18-alpine

# Set working directory
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x ./scripts/docker-start.sh

# Expose port
EXPOSE 3000

CMD ["sh", "./scripts/docker-start.sh"]