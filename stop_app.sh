set -e

HOSTNAME=$1
HOST_IP_ADDR=$(docker inspect "$HOSTNAME" | json -a NetworkSettings.IPAddress)

curl -i -X DELETE http://localhost:8081/apps/$HOSTNAME

docker ps | grep "$HOSTNAME" | awk '{ print $1 }' | xargs docker stop
docker ps -a | grep "$HOSTNAME" | awk '{ print $1 }' | xargs docker rm
sudo iptables -S | grep $HOST_IP_ADDR.*docker0.*ACCEPT | awk '{ gsub("-A", "sudo iptables -D", $0); print $0 }' | xargs -0 /bin/bash -c
