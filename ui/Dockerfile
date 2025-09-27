# Step 1: Build Vite app
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

# Step 2: Serve with static server
FROM node:18-alpine
WORKDIR /app
RUN yarn global add serve
COPY --from=builder /app/dist /app/dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
