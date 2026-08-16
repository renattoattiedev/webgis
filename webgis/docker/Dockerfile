FROM node:22.13.1 as build
WORKDIR /app
COPY . .

ARG API_URL
ARG RECAPTCHA_SITE_KEY
ARG ENVIRONMENT
ARG GEOSERVER_HOST

ENV ENVIRONMENT=$ENVIRONMENT

RUN npm ci && npm cache clean --force

RUN sed -i "s|\${API_URL}|${API_URL}|g" src/environments/environment*.ts && \
    sed -i "s|\${RECAPTCHA_SITE_KEY}|${RECAPTCHA_SITE_KEY}|g" src/environments/environment*.ts

RUN npm run "build:${ENVIRONMENT}"

RUN sed "s|\${GEOSERVER_HOST}|${GEOSERVER_HOST}|g" docker/httpd.conf.template > docker/httpd.conf

FROM localhost:8080/httpd:2.4.43
WORKDIR /usr/local/apache2
COPY --chown=root:root --from=build /app/docker/httpd.conf conf/httpd.conf
COPY --chown=www-data:www-data --from=build /app/dist/webgis htdocs
EXPOSE 4200