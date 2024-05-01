# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

COPY prisma ./prisma/
COPY .env ./env
RUN npx prisma generate
# Copy the current directory contents into the container at /app
COPY . .

# Compile TypeScript into JavaScript
RUN npm run build

# Run the app when the container launches
CMD [ "node", "dist/app.js" ]
