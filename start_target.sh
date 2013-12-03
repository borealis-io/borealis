set -e

PORT=5000
TARGET=$(docker run -t -d -p $PORT -e "PORT=$PORT" -e "SERVER_ID=$SERVER_ID" -name=$HOST node-sample)
TARGET_IP=$(docker inspect $TARGET | json -a NetworkSettings.IPAddress)

sudo iptables -D FORWARD -i docker0 -o docker0 -j DROP

sudo iptables -A FORWARD -s $ROUTER_IP/32 -d $TARGET_IP/32 -i docker0 -o docker0 -p tcp -m tcp --dport $PORT -j ACCEPT
sudo iptables -A FORWARD -s $TARGET_IP/32 -d $ROUTER_IP/32 -i docker0 -o docker0 -p tcp -m tcp --sport $PORT -j ACCEPT

sudo iptables -A FORWARD -i docker0 -o docker0 -j DROP
 
curl -i -d "host=$HOST&target=http%3A%2F%2F$TARGET_IP%3A$PORT" -X POST http://localhost:8081/apps
