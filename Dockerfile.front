FROM node:16.5
COPY front/package.json front/package-lock.json /app/front/
WORKDIR /app/front
RUN npm ci
COPY ./front/ /app/front
COPY ./back/src/shared /app/back/src/shared
RUN npm run copy-shared
RUN npm run build-with-shared-as-is
RUN npm run prod-env-config
CMD npm run serve -- --host 0.0.0.0
