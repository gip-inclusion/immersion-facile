FROM nginx

RUN apt-get update && \
    apt-get -y install certbot cron python3-certbot-nginx procps

RUN mkdir -p /certbot

ARG ENV_TYPE

RUN mkdir -p /etc/nginx/ssl

ENV ENV_TYPE=$ENV_TYPE

CMD echo $ENV_TYPE; \
    [ "$ENV_TYPE" = "production" ] && cp /etc/nginx/conf.d/ssl/* /etc/nginx/ssl || rm -f /etc/nginx/ssl/*; \
    service cron start && \
    service nginx start && \
    sleep infinity
