FROM node:10-alpine

ENV NODE_ENV = "development"

USER node

WORKDIR /home/node

COPY --chown=node:node . .

EXPOSE 3000

WORKDIR /home/node/api

CMD [ "node", "app.js"]