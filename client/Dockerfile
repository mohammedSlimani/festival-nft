FROM node:14

WORKDIR /home/app-ui

COPY . .

RUN npm install

ENV port 3000
EXPOSE 3000


ENTRYPOINT npm start