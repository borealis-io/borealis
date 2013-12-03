APP_PREFIX=app-
APP_PREFIX_LENGTH=$((${#APP_PREFIX}+1)) # Adding one for the slash (e.g., /app-appname.hostname.io)

if [ "$1" == "-q" ]
then
	docker ps -q | \
		xargs docker inspect | \
		json -a Name | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^$APP_PREFIX" | \
                awk "{ print substr(\$0, $APP_PREFIX_LENGTH); }"
else
	(echo NAME ID && docker ps -q | \
		xargs docker inspect | \
		json -a Name ID | \
		awk '{ print substr($0, 2); }' | \
		grep --color=never "^$APP_PREFIX" | \
                awk "{ print substr(\$0, $APP_PREFIX_LENGTH); }") | \
		column -t
fi
