# borealis

A Platform-as-a-Service based on [Docker](http://www.docker.io) and [Node.js](http://nodejs.org).

Borealis features:

* Deploy apps using Git.
* Dynamic HTTP routing.
* Heroku buildpack support.
* Containers all the way down.

This project is in early stage development.

## Modules

### host

An API that runs on the host machine.  It's responsible for managing app containers.

### deploy

An SSH server for receiving Git deployments.

### logging

Send logs via a WebSocket API.

### router

Route incoming HTTP requests to the corresponding app.

## License

MIT
