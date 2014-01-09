#!/usr/bin/env bash
set -eo pipefail;

case "$1" in
  git-hook)
    APP=$2

    while read oldrev newrev refname
    do
      # Only run this script for the master branch. You can remove this
      # if block if you wish to run it for others as well.
      if [[ $refname = "refs/heads/master" ]] ; then
        echo "Archiving rev $newrev." >> "$HOME/.logs"
        git archive $newrev > "$HOME/tmp/$newrev.tar"
        curl -i -X POST --data-binary "@$HOME/tmp/$newrev.tar" -H "Content-Type: application/x-tar" "http://localhost:5000/builds/$APP"
      fi

    done
    ;;

  git-*)
    APP="$(echo $2 | sed 's/\///' | sed "s/'//g")"
    APP_PATH=$HOME/$APP
    echo "Staging to $APP_PATH with args $@" >> "$HOME/.logs" 
    if [[ $1 == "git-receive-pack" && ! -d $APP_PATH ]]; then
        git init --bare $APP_PATH > /dev/null
        PRERECEIVE_HOOK="$APP_PATH/hooks/pre-receive"
        cat > $PRERECEIVE_HOOK <<EOF
#!/usr/bin/env bash
set -e; set -o pipefail;
cat | ~/git-receive.sh git-hook $APP
EOF
        chmod +x $PRERECEIVE_HOOK
        echo "Hook and repo generated." >> "$HOME/.logs"
    fi
    args="$( echo $@ | sed 's/\///' )"
    echo "shell results $args" >> "$HOME/.logs"
    git-shell -c "$args"
    ;;
	

  help)
    echo "no help for you" | cat 
    ;;
esac
