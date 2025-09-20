# Use the official Node.js image as a base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
COPY package-lock.json ./

# Install the dependencies
# Use --legacy-peer-deps to avoid issues with dependency versions
RUN npm install --legacy-peer-deps

# Copy the rest of the application's source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# The command to start the app (will be overridden by docker-compose)
CMD ["npm", "start"]