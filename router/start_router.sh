set -e

ROUTER_CONTAINER_ID=$(docker run -d -t -p 80:8080 -p 127.0.0.1:8081:8081 -e "PORT=8080" -e "ADMIN_PORT=8081" -name "router" node-director)

docker inspect $ROUTER_CONTAINER_ID | json -a NetworkSettings.IPAddress
