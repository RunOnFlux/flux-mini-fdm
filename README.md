# Dockerized mini FDM

This container provides an HAProxy instance with Let's Encrypt certificates generated
at startup, as well as renewed (if necessary) once a week with an internal cron job. It calls Flux API every few munites and updates HAProxy server list for the provided flux `APP_NAME` and `APP_PORT`.

## Usage

### Pull from Github Packages:

```
docker pull alihmahdavi/flux-lb:latest
```

### Build from Dockerfile:

```
docker build -t flux-lb:latest .
```

### Run container:

Example of run command (replace APP_NAME, APP_PORT, CERTS, EMAIL values and volume paths with yours)

```
docker run --name lb -d \
    -e APP_NAME=my-flux-app-name \
    -e APP_PORT=my-flux-app-port \
    -e CERT1=my-common-name.domain \
    -e EMAIL=my.email@my.domain \
    -e STAGING=false \
    -p 80:80 -p 443:443 -p 8080:8080 \
    alihmahdavi/flux-lb:latest
```

### Customizing Haproxy

    docker run [...] -v <override-conf-file>:/etc/haproxy/haproxy.cfg alihmahdavi/flux-lb:latest

The haproxy configuration provided file comes with the "resolver docker" directive to permit DNS run-time resolution on backend hosts (see https://github.com/gesellix/docker-haproxy-network)

### Renewal cron job

Once a week a cron job checks for expiring certificates with certbot agent and reload haproxy if a certificate is renewed. No container restart needed.


