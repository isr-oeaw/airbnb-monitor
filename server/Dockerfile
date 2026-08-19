FROM node:22-alpine

WORKDIR /server
COPY search-log.mjs .

ENV PORT=3001
EXPOSE 3001

CMD ["node", "search-log.mjs"]
