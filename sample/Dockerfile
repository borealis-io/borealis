FROM	heroku/heroku-buildpack-nodejs
MAINTAINER	Kevin Swiber <kswiber@gmail.com>
ADD	.	/app
RUN	/buildpack/bin/compile /app /tmp
CMD	["sh", "-c", "/app/bin/node /app/index.js"]
