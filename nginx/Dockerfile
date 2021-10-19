FROM nginx

ARG ENV_TYPE
ENV ENV_TYPE=$ENV_TYPE

ARG DOMAIN
ENV DOMAIN=${DOMAIN:-domain.tld}

ARG LETSENCRYPT_MAIL
ENV LETSENCRYPT_MAIL=${LETSENCRYPT_MAIL:-not_provided@mail.com}

ADD ./web/nginxautossl.tar.xz /

RUN [ "$ENV_TYPE" = "production" ] && INIT="ssl"; /nginxautossl.sh "init$INIT";
CMD [ "$ENV_TYPE" = "production" ] && INIT="ssl"; /nginxautossl.sh "run$INIT" $DOMAIN $LETSENCRYPT_MAIL && \
    sleep infinity
