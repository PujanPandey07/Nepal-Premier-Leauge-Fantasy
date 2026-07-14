# ---- Stage 1: Build ----
# Use Node to install dependencies and compile React into static files
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy only package files first, so dependency install is cached
# separately from source code changes
COPY package*.json ./

 #Install exact versions from package-lock.json (npm ci is stricter
# and faster than npm install — meant for automated/CI environments)
RUN npm ci

# Now copy the rest of the frontend source code
COPY . .

# Compile React into static HTML/CSS/JS — output goes to /app/dist by default (Vite)
RUN npm run build

# ---- Stage 2: Serve ----
# Fresh, minimal image — just nginx, no Node.js or source code
FROM nginx:1.27-alpine

# Copy only the compiled static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx config (routing rules) into nginx's config folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80