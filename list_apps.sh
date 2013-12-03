APP_PREFIX=app-

if [ "$1" == "-q" ]
then
	docker ps -q | \
		xargs docker inspect | \
		json -a Name | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^$APP_PREFIX"
else
	(echo NAME ID && docker ps -q | \
		xargs docker inspect | \
		json -a Name ID | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^$APP_PREFIX") | \
		column -t
fi
