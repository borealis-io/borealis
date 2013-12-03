set -e

ROUTER=$(docker run -d -t -p 80:8080 -p 127.0.0.1:8081:8081 -e "PORT=8080" -e "ADMIN_PORT=8081" node-director)
ROUTER_IP=$(docker inspect $ROUTER | json -a NetworkSettings.IPAddress)
echo $ROUTER_IP
