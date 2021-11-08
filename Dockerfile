FROM node:latest

WORKDIR /clinical
COPY ./ ./
ADD start.sh /start.sh
RUN chmod 755 /start.sh
CMD ["/start.sh"]