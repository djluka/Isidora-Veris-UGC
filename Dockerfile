FROM httpd:2.4

# Copy your website files into Apache's document root
COPY ./public /usr/local/apache2/htdocs

# Expose the default HTTP port
EXPOSE 80


FROM node

RUN mkdir /app
WORKDIR /app

COPY ./src/package-lock.json /app
