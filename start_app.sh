set -e

for HOSTNAME in "$@"
do
	APP_NAME=app-$HOSTNAME
	PORT=5000
	
	ROUTER_IP_ADDR=$(docker inspect router | json -a NetworkSettings.IPAddress)
	
	APP_CONTAINER_ID=$(docker run -t -d -p $PORT -e "PORT=$PORT" -e "SERVER_ID=$SERVER_ID" -name=$APP_NAME node-sample)
	APP_IP_ADDR=$(docker inspect $APP_CONTAINER_ID | json -a NetworkSettings.IPAddress)
	
	sudo iptables -D FORWARD -i docker0 -o docker0 -j DROP
	
	sudo iptables -A FORWARD -s $ROUTER_IP_ADDR/32 -d $APP_IP_ADDR/32 -i docker0 -o docker0 -p tcp -m tcp --dport $PORT -j ACCEPT
	sudo iptables -A FORWARD -s $APP_IP_ADDR/32 -d $ROUTER_IP_ADDR/32 -i docker0 -o docker0 -p tcp -m tcp --sport $PORT -j ACCEPT
	
	sudo iptables -A FORWARD -i docker0 -o docker0 -j DROP
	 
	curl -i -d "host=$HOSTNAME&target=http%3A%2F%2F$APP_IP_ADDR%3A$PORT" -X POST http://localhost:8081/apps
done
