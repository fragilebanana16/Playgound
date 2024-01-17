FROM node:20-alpine3.18

USER root

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD npm start