set -e

HOST=$1
HOST_IP=$(docker inspect "$HOST" | json -a NetworkSettings.IPAddress)

echo $HOST
echo $HOST_IP

curl -i -X DELETE http://localhost:8081/apps/$HOST

docker ps | grep "$HOST" | awk '{ print $1 }' | xargs docker stop
docker ps -a | grep "$HOST" | awk '{ print $1 }' | xargs docker rm
sudo iptables -S | grep $HOST_IP.*docker0.*ACCEPT | awk '{ gsub("-A", "sudo iptables -D", $0); print $0 }' | xargs -0 /bin/bash -c
