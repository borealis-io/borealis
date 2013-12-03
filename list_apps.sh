if [ "$1" == "-q" ]
then
	docker ps -q | \
		xargs docker inspect | \
		json -a Name | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^app-"
else
	docker ps -q | \
		xargs docker inspect | \
		json -a Name ID | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^app-" | \
		awk '{ print "NAME ID"; print $0; }' | \
		column -t
fi
