set -e

docker ps | grep "/app/bin/node" | awk '{ print $1 }' | xargs docker stop
docker ps -a | grep "/app/bin/node" | awk '{ print $1 }' | xargs docker rm
sudo iptables -S | grep docker0.*ACCEPT | awk '{ gsub("-A", "sudo iptables -D", $0); print $0 }' | xargs -0 /bin/bash -c
