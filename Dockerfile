FROM node:10-alpine

WORKDIR /usr/src/scout

COPY ./api/package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

WORKDIR /usr/src/scout/api

CMD [ "node", "app.js"]