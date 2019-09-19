FROM node:10-alpine as base
# Alpine images missing dependencies
RUN apk add --no-cache git
WORKDIR /usr/app

# App and dev dependencies
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --production=false
# App source
COPY . .



