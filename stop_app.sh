set -e

APP_PREFIX=app-
HOSTNAME=$1

APP_NAME=$APP_PREFIX$HOSTNAME

HOST_IP_ADDR=$(docker inspect "$APP_NAME" | json -a NetworkSettings.IPAddress)

curl -i -X DELETE http://localhost:8081/apps/$HOSTNAME

docker stop $APP_NAME
docker rm $APP_NAME

sudo iptables -S | grep $HOST_IP_ADDR.*docker0.*ACCEPT | awk '{ gsub("-A", "sudo iptables -D", $0); print $0 }' | xargs -0 /bin/bash -c
