FROM node:16.5
COPY front/package.json front/package-lock.json /app/front/
WORKDIR /app/front
RUN npm ci 
COPY . /app
RUN npm run build
CMD npm run serve -- --host 0.0.0.0
