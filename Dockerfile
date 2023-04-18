FROM node:latest

WORKDIR /app

COPY package.json .

RUN npm install

RUN node test.js

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
