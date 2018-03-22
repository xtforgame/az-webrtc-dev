FROM node:8-onbuild

RUN mkdir -p /usr/volumes/src /usr/volumes/share /usr/volumes/output
VOLUME ["/usr/volumes/src", "/usr/volumes/share", "/usr/volumes/output"]

COPY docker-cmd.sh /usr/src/app/

EXPOSE 10000-10100 9310 9527 3001 443
