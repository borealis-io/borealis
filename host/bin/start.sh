PORT=3000

# BRIDGE_SRC=$(ip addr show docker0 | grep "inet\s" | awk '{ print $2 }')
MGMT_API_IP_ADDR=
BRIDGE_IP_ADDR=$(ifconfig docker0 | sed -n '2 p' | awk '{print $2}' | sed  's/addr://');

INPUT="INPUT -user-input -s $MGMT_API_IP_ADDR -d $BRIDGE_IP_ADDR -p tcp -m tcp --dport $PORT -j ACCEPT"

if [ ! iptables -C $INPUT 2>&1 ];
then
  iptables -A $INPUT
fi

/bin/bash -c PORT=$PORT HOST=$BRIDGE_IP_ADDR node ../
