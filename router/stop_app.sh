set -e

APP_PREFIX=app-

for HOSTNAME in "$@"
do
	echo "---> Stopping app: $HOSTNAME"

	APP_NAME=$APP_PREFIX$HOSTNAME
	
	HOST_IP_ADDR=$(docker inspect "$APP_NAME" | json -a NetworkSettings.IPAddress)
	
	CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8081/apps/$HOSTNAME)
	
	if [ $CODE == "204" ]
	then
		echo "---> Host removed from router."
	else
		echo "---> Host not found in router."
	fi

	docker stop $APP_NAME > /dev/null
	docker rm $APP_NAME > /dev/null

	echo "---> App container removed."
	
	sudo iptables -S | grep $HOST_IP_ADDR.*docker0.*ACCEPT | awk '{ gsub("-A", "sudo iptables -D", $0); print $0 }' | xargs -0 /bin/bash -c
	echo "---> Network access cleaned."

	echo "---> Done."
done
