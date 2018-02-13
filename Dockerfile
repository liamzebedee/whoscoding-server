FROM mhart/alpine-node:9
WORKDIR /src
COPY src/ /src
EXPOSE 3000
CMD ["npm", "start"]