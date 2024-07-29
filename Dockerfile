#
# To build the image locally, run the following command from the PARENT of this directory
#
# docker build --tag DDDDDDDD/easelgeo-session .

FROM node:14

# Create a working directory in the container and make it the current dir
WORKDIR /usr/web/app
COPY package.json .
COPY tsconfig.json .

# For the two .ts files below, it is important to copy them
# and mimic the actual structure on the local directory
# /usr/web/app/server/geo.ts
# /usr/web/app/src/firebase-backend.ts
COPY geo.ts .
# COPY firebase-backend.ts .

RUN npm install && (cd /usr/web/app && npx tsc)

# Ignored on Heroku
EXPOSE $PORT

CMD ["node", "geo.js"]
