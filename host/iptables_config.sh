#!/bin/bash

INTERFACE=${1:-docker0}

HOST_IP=`/sbin/ifconfig $INTERFACE | sed -n '2 p' | awk '{print $2}' | sed  's/addr://'`
IFS=. read -a o <<< "...$HOST_IP"
DEVICE_SUBNET="${o[-4]}.${o[-3]}.0.0/16"

iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

# For container access to hosts docker api at tcp 4242
#iptables -A INPUT -s 172.17.0.5/32 -d 172.17.42.1/32 -i docker0 -p tcp -m tcp --dport 4242 -j ACCEPT

iptables -A INPUT -s $DEVICE_SUBNET -d $HOST_IP/32 -i docker0 -m conntrack --ctstate RELATED,ESTABLISH$
iptables -A INPUT -s $DEVICE_SUBNET -d $HOST_IP/32 -i docker0 -j DROP

iptables -A FORWARD -i docker0 ! -o docker0 -j ACCEPT
iptables -A FORWARD -o docker0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i docker0 -o docker0 -j DROP