# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install any needed packages specified in package.json
RUN npm install
RUN npx prisma generate
# Compile TypeScript into JavaScript
RUN npm run build

# Run the app when the container launches
CMD [ "node", "dist/app.js" ]
