#!/bin/bash

APP=app1
COUNT=0
while [ 1 ]; do
	MSG="Log....$COUNT";
	let COUNT=$COUNT+1
	
	curl  \
		 -H "Content-Type:application/json" \
		 -X POST \
		 -d '{"message" : "'$MSG'"}' \
		 http://localhost:3000/logs/$APP

	sleep 0.5
done
