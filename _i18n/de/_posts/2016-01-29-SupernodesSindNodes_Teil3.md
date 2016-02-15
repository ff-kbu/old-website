---
layout: default
title: "Supernodes sind Nodes"
author: "Frank Nord"
date: 2016-02-11 00:00:00
---
# Nicht als Server gedacht - Teil 3
Mesh-On-WAN, Babel, fastd, L2TP, DNS, etc. .  Bau' Deinen Node aus!

Diese Serie besteht aus 3 Teilen. Teil 1 ist ein Howto zu Supernodes und Nodes. Teil 2 geht auf Dezentralisierung und die Probleme des KBU Netzes im Dezember / Januar ein. Teil 3 gibt einen technischen Ausblick. Dies ist Teil 3.

<!--break-->

## Zusammenfassung Teil 1+2

Freifunk-Netze bestehen aus *Nodes*. Nodes routen Traffic. Sie verbinden Clients mit dem Freifunk-Netz, ohne dass auf Endgeräten Software installiert werden muss.

In Teil 1 hab' ich erzählt, wie Du eine OpenWRT-Box als Node konfigurieren kannst. Dabei habe ich OpenWRT-Boardmittel benutzt und jede Menge Einstellungen gesetzt. Am Ende existierte ein Node, der IPv4-Adressen per DHCP verteilt, das Internet über ein hide.me-VPN freigibt und über das KBU-Backbone-VPN routed. 

In Teil 2 hab' ich die Entwicklung des Freifunk-KBU Netzes dargelegt. Dabei ich hab' Probleme aufgezeigt, die entstanden sind: Wenige zentrale Nodes sind überlastet, werden auf dedizierten Servern betrieben und von 3-4 Admins gewartet. Technische Impulse fehlen.

Am Ende vom zweiten Teil steht das Fazit, dass die alte Unterscheidung zwischen Nodes und Supernodes keinen Sinn macht. Jeder Node muss routen um das Netz zu entlasten und zu demokratisieren. Accesspoints unterstützen Nodes dabei, Clients zu verbinden. 

Hier ist nun der dritte und letzte Teil. 

## Den Node erweitern

Der Node aus Teil 1 funktioniert - einige Dinge fehlen aber:

* Routing findet nur über VPN statt - nicht über das WLAN.
* Roaming ist nur über WLAN möglich - eine Entlastung per Kabel nicht.
* Eine Einbindung von Richtfunkstrecken ist nicht möglich.

Zudem wird Tinc und OpenVPN mit AES / OpenSSL verwendet. Die Verfahren sind sicher, aber langsam und benötigen viel Speicherplatz. Einige Geräte (bspw. TP-Link TL-WR841n) haben dafür zu wenig Flash-Speicher.

In diesem Artikel schreibe ich über Ideen, mit diesen Problemen umzugehen. Anders als in Teil 1 wird die Technik bei Freifunk-KBU noch nicht verwendet. Alles ist experimentell. Möglicherweise stellst Du fest, dass das eine oder das andere eine ziemlich dumme Idee ist. Melde Dich dann auf der Mailingsliste und diskutiere darüber. Der Fahrplan:

1. Mesh-Routing über Babel
2. Roaming über Kabel: batman-adv und tinc über WAN / LAN
3. Ohne Tinc: fastd und Babel.
4. Ersatz für OpenVPN: hide.me mit PPTP
5. Gerichtete Links: L2TP
6. Platz schaffen: OpenWRT ohne Webgui

### 1. Mesh-Routing über Babel
In Teil 1 hab' ich gezeigt, wie Du Routing über Tinc konfigurieren kannst. Zusätzlich kannst Du Routes mit benachbarten Nodes austauschen. Installiere hierzu babel. Konfiguriere es, Routes aus <code>table 66</code> im Netz zu verbreiten. <code>wlan0</code> ist das Ad-Hoc interface, das in Babel eingebunden wird. Weiterhin muss der IP-Range in <code>table 66</code> eingetragen werden, damit er von Babel exportiert wird.

{% highlight bash %}
        opkg install babeld

uci -q batch <<EOF
        set babeld.@general[0].export_table='66'
        set babeld.@general[0].import_table='66'

        add babeld interface
        set babeld.@interface[-1].ifname='wlan0'
        commit babeld

        add network route
        set network.@route[-1]=route
        set network.@route[-1].interface='freifunk'
        set network.@route[-1].target='172.27.8.0'
        set network.@route[-1].netmask='255.255.255.128'
        set network.@route[-1].gateway='0.0.0.0'
        set network.@route[-1].metric='0'
        set network.@route[-1].mtu='1500'
        set network.@route[-1].table='66'
        commit network

EOF
/etc/init.d/babeld restart
{% endhighlight %}

#### Debugging

Der Start von babeld generiert die config <code>/var/etc/babeld.conf</code>. Falls generiert, kannst Du babeld auch im Vorderung starten.
{% highlight bash %}
/etc/init.d/babeld stop
babeld -d 2 -c /var/etc/babeld.conf
{% endhighlight %}

Falls Du </code>/etc/config/babeld</code> änderst, musst Du Config durch den Start von babeld neu generieren. Das geht bspw. mit 
<code>/etc/init.d/babeld restart; /etc/init.d/babeld stop</code>

### 2. batman-adv / tinc über Draht

Der Nodes erlauben *Roaming*: Stehen mehrere in einem Gebäude, so können sich Endgeräte von einem WLAN zum anderen verbinden ohne das IP-Verbindungen getrennt werden. Dabei werden die Datenpakete innerhalb des Meshes zu dem Node gesendet, von dem das Endgerät die IP-Adresse hat. 
Bei größeren Installation ist es daher hilfreich, die Geräte zusätzlich per Kabel zu verbinden um die Funkverbindung zu entlasten. Dies erreichst Du, indem Du das WAN-Interface dem bat0-Interface hinzufügst. batman-adv Frames werden dann über das WAN-Interface gesendet

Gleichzeitig kannst Du Tinc-Peerings über Draht konfigurieren um direkte, unverschlüsselte Verbindungen zu erlauben. Hierzu wird Tinc in der Firewall freigegeben. 

{% highlight bash %}
uci -q batch <<EOF
        add firewall rule 
        
    set firewall.@rule[-1].name='Tinc (Mesh-On-WAN)'
    set firewall.@rule[-1].src='wan'
    set firewall.@rule[-1].dest_port='655'
    set firewall.@rule[-1].proto='tcpudp'
    set firewall.@rule[-1].target='ACCEPT'
    set firewall.@rule[-1].family='ipv4'   
    commit firewall

        set network.mesh_wan='interface'
        set network.mesh_wan.ifname='eth1' # Durch tatsaechliches WAN-Interface ersetzen!
        set network.mesh_wan.mesh='bat0'
        set network.mesh_wan.proto='batadv'
        commit network

EOF
/etc/init.d/firewall restart
/etc/init.d/network restart
{% endhighlight %}

Zusätzlich müssen für die Tinc-Peers noch lokale Adressen eingetragen werden, damit die Verbindung aufgebaut wird. Hier wird der node <code>mein_anderer_node</code> als lokaler Peer definiert und die Crypto ausgeschaltet. Das Beispiel zeigt die Konfigurationsdateien.

#### Tinc-Konfiguration
{% highlight bash %}
# /etc/tinc/kbubackbone/tinc.conf 
Mode =  Router
Name =  mein_neuer_supernode
Device= /dev/net/tun
ConnectTo = paul
ConnectTo = paula
ConnectTo = mein_anderer_node
{% endhighlight %}

#### Node-Konfiguration
{% highlight bash%}
# /etc/tinc/kbubackbone/hosts/mein_anderer_node 
# LAN-Adresse
Address=192.168.41.27 
Subnet=172.27.8.128/25
# Crypto ist aus
Cipher=none

-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA1nroE8C062MsqDbPetfh/1ZjoljlrCZnVdu/d3w463tEZ4kVksKP
k+WD9YwJn06Z8SU9D2G16fHrZINvmMhCnWZ/5oLMsupfoV5BFy6O87OlaHcXQ3e3
D2nMplsSnaUo8XEYiYncep2nkewmUnsoHF86SSzTi8/mCknVVrTvmK8ssB4ZR7nu
98LSZ5yeGvJ8Ysbg0a/hE8lKeLmSI3+PJy3CiyJaEzdM0FGBkoshLC3jL/bMwxk4
J7CYpbaf/rphshg0LvWbjzs7EOdI5HpwdrTj9jNc5gkebDvnklYb8rLTOcLz07Y+
dPDcn+ohgUts/pNrGo7jPIAWhu8R0j9OvwIDAQAB
-----END RSA PUBLIC KEY-----


{% endhighlight %}


### 3. Backbone-Routing ohne Tinc

In Teil 1 wird Tinc verwendet, um Datenpakete mit anderen Nodes auszutauschen. Tinc benötigt OpenSSL und damit viel Speicherplatz. Als Link-State-Routing-Protokoll belastet es die Nodes zusätzlich. Babel benötigt weniger. Komplizierter ist das Routing zu anderen Nodes, die nicht per Funk oder Kabel erreichbar sind:

* Mit welchen anderen Nodes möchte ich Daten austauschen?
* Welches Routing-Protokoll verwende ich?

Da ich einen IP-Adressbereich der KBU-Community verwende, entscheide ich mich für babel und fastd-Tunnel. Babel ist dabei das <a href="https://de.wikipedia.org/wiki/Interior_Gateway_Protocol"> Interior Gateway Protocol (IGP)</a>. Aktuell gibt es kaum fastd-Babel-Peerings im KBU-Netz. Alles ist experimentell.

Es gibt zwei naheliegende Alternativen:

1. Kein fastd oder ein anderes VPN verwenden. Das Freifunk-Netz besteht dann autark ohne Internet.
2. Das <a href="https://wiki.freifunk.net/IC-VPN">Intercity-VPN (ICVPN)</a> und BGP verwenden.

In der Praxis könnten alle Alternativen relevant sein: Bei Nodes ohne Internet-Uplink macht ein VPN keinen Sinn. Gleichzeitig wird es hoffentlich Peerings mit dem ICVPN-Zugang geben. Alles ist experimentell und ich kann nicht absehen, was sich am Ende durchsetzt. Ich zeig' einfach mal wie's geht.

#### Netzwerk-Konfiguration

Das VLAN für Babel wird als <code>babel_vlan</code> mit <code>tag 42</code> definiert. <code>eth1</code> ist hier das WAN-Interface.
Das fastd-Interface wird als tun-Interface gesetzt. Beiden Interfaces wird 172.27.8.1/32 zugewiesen. Weitere Routes werden über babel ermittelt

{% highlight bash%}

uci -q batch <<EOF
        set network.babel_vlan='interface'
        set network.babel_vlan.proto='static'
        set network.babel_vlan.ifname='eth1.42'
    set network.babel_vlan.ipaddr='172.27.8.1'
    set network.babel_vlan.netmask='255.255.255.255'
        set network.babel_vlan.ip4table='66'


    set network.fastd='interface'
    set network.fastd.ifname='tap-fastd'
    set network.fastd.proto='static'
    set network.fastd.ipaddr='172.27.8.1'
        set network.fastd.netmask='255.255.255.255'
        set network.fastd.ip4table='66'


    commit network

    add babeld interface
        add babeld interface
        set babeld.@interface[-1].ifname='eth1.42'
        set babeld.@interface[-2].ifname='tap-fastd'
        commit babeld

EOF
/etc/init.d/network restart
{% endhighlight %}

In <code>/etc/config/firewall</code> muss die Freifunk-Zone nun insb. <code>fastd</code> und <code>babel_vlan</code> enthalten.

{% highlight bash%}
config zone                                     
        option forward 'ACCEPT'        
        option output 'ACCEPT'        
        option input 'REJECT'      
        option mtu_fix '1'                  
        option name 'freifunk'              
        option network 'bat0 freifunk mesh kbubackbone babel_vlan fastd'

{% endhighlight %}


#### Fastd-Konfiguration

Fastd lauscht auf Port 10000. Keys werden generiert. Ein Peer ist definiert.
{% highlight bash%}
opkg install fastd


uci -q batch <<EOF

    set fastd.mein_anderer_node='peer'
        set fastd.mein_anderer_node.enabled='1'
        set fastd.mein_anderer_node.net='backbone'
        set fastd.mein_anderer_node.key='25c4332cafaaf350e9cf0969d755121b6f7015b9cd99dc421a29445edfb0629b'
        set fastd.backbone=fastd
        set fastd.backbone.secret='generate'
        set fastd.backbone.enabled='1'
        set fastd.backbone.syslog_level='info'
        set fastd.backbone.mode='tap'
        set fastd.backbone.interface='tap-fastd'
        set fastd.backbone.mtu='1312'
        set fastd.backbone.forward='0'
        set fastd.backbone.secure_handshakes='1'

        add_list fastd.backbone.method='salsa2012+umac'
        add_list fastd.backbone.bind='any:10000'
        commit fastd

        add firewall rule 
        
    set firewall.@rule[-1].name='fastd'
    set firewall.@rule[-1].src='wan'
    set firewall.@rule[-1].dest_port='10000'
    set firewall.@rule[-1].proto='udp'
    set firewall.@rule[-1].target='ACCEPT'
    set firewall.@rule[-1].family='ipv4'   
    commit firewall

EOF
/etc/init.d/firewall restart
/etc/init.d/fastd restart
{% endhighlight %}

Hier ist Beispielhaft ein peer *mein_anderer_node* konfiguriert. Hier musst Du wahrscheinlich Dinge anpassen.

Wenn Du mit anderen peeren möchtest, musst Du Port 10000/tcp in Deiner Firewall (z.B. auf Deiner Fritzbox) freigeben.
Dann kannst Du auf der Mailingliste fragen, wer mit Dir peeren will. Deinen Public-Key siehst Du mit <code>echo "secret \"$(uci get fastd.backbone.secret)\";" | fastd -c - --show-key</code>.

### 4. Hide.me mit PPTP

Hide.me bietet auf Verbindungen über PPTP an. PPTP ist nicht so sicher wie OpenVPN und kann gebrochen werden. Trotzdem hilft es gegen *Deep-Packet-Inspection*. Der PPTP-Client kommt ohne SSL-Library aus, benötigt weniger Platz und ist schneller als OpenVPN. Der Zugang wird wie folgt konfiguriert.

*Hinweise* 

- Die OpenVPN-konfiguration sollte vorher gelöscht werden.
- PPTP nutzt GRE - NAT-Firewall müssen ggf. konfiguriert werden (https://wiki.openwrt.org/doc/howto/vpn.nat.pptp)

{% highlight bash%}
opkg install ppp-mod-pptp kmod-nf-nathelper-extra

uci -q batch <<EOF
        set network.hideme=interface
        set network.hideme.proto='pptp'
        set network.hideme.server='DE.HIDE.ME'
        set network.hideme.username='hideme_test'
        set network.hideme.password='ganz geheim und inzwischen geaendert'
        set network.hideme.ip4table='66'
        set network.hideme.peerdns='0'

        commit network
EOF

/etc/init.d/network restart
{% endhighlight %}


### 5. Gerichtete Verbindungen - L2TP

L2TP, das *Layer-2 Tunnel Protocol* erlaubt schnelle VPN-Verbindung. Die wichtigsten Unterschiede zu fastd:

* L2TP ist ein Kernel-Modul, damit kaum CPU-Last
* L2TP kann kein Crypto, damit ist Deep-Packet-Inspection möglich
* L2TP ist kein Deamon. Jeder Peer muss einzeln konfiguriert werden.

L2TP ist wichtig, wenn Richtfunk-Strecken eingesetzt werden. Da Broadcast / Multicast eine wesentlich geringer Datenrate hat, wird die Kapazität von den batman-adv oder Babel Paketen schnell aufgebraucht. In L2TP-Pakete verpackt können sie aber als Unicast an das andere Ende der Richtfunkstrecke gesendet werden.

L2TP ist nicht wirklich in OpenWRT integriert - Tunnel können nicht über <code>/etc/config/network</code> konfiguriert werden. Die Protocol-Option erwartet einen IPSec-Server auf der Gegenseite. In diesem Beispiel ist der Node mit zwei Richtfunkstrecken verbunden

#### Software Installation 

<code>ip</code> kann keine L2TP Tunnel einrichten - Du benötigst das Paket <code>ip-full</code> und ein paar Kernel-Module
{% highlight bash%}
opkg remove ip
opkg install ip-full kmod-l2tp kmod-l2tp-eth kmod-l2tp-ip 
{% endhighlight %}

### Tunnel konfigurieren

In diesem Beispiel hängen beide Richtfunkstrecken am Lan-Interface des Nodes. *Das ist nicht klug*, aber in diesem Beispiel verzichten wir auf die Partitionierung des Switches.

<code>/etc/init.d/l2tp-tunnel</code>
{% highlight bash%}
#!/bin/sh /etc/rc.common
#Copyright (C) 2016 Frank Nord <frank.nord@mailbox.org>



START=99
STOP=22

# Kirchturm 1: Tunnel 1000 / Session 1000
# Kirchturm 2: Tunnel 2000 / Session 2000

start () {
        /usr/sbin/ip l2tp add tunnel tunnel_id 1000 peer_tunnel_id 1000 encap ip local 192.168.1.1 remote 192.168.1.2
        /usr/sbin/ip l2tp add tunnel tunnel_id 2000 peer_tunnel_id 2000 encap ip local 192.168.1.1 remote 192.168.1.3
        /usr/sbin/ip l2tp add session tunnel_id 1000 session_id 1000 peer_session_id 1000
        /usr/sbin/ip l2tp add session tunnel_id 2000 session_id 2000 peer_session_id 2000

        # Interfaces starten - Devices sind nun verfuegbar
        /sbin/ifup kirchturm0
        /sbin/ifup kirchturm1
}

stop () {
        /usr/sbin/ip l2tp del session tunnel_id 1000 session_id 1000 peer_session_id 1000
        /usr/sbin/ip l2tp del session tunnel_id 2000 session_id 2000 peer_session_id 2000
        /usr/sbin/ip l2tp del tunnel tunnel_id 1000 peer_tunnel_id 1000 encap ip local 192.168.1.1 remote 192.168.1.2
        /usr/sbin/ip l2tp del tunnel tunnel_id 2000 peer_tunnel_id 2000 encap ip local 192.168.1.1 remote 192.168.1.3

}
{% endhighlight %}

*Hinweise*: 

- <code>chmod 755 /etc/init.d/l2tp-tunnel</code> nicht vergessen.
- Es können nur tunnel mit existierenden Adressen aufgebaut werden
- <code>/etc/init.d/l2tp-tunnel start</code> ausführen

### UCI Konfiguration
{% highlight bash%}
uci -q batch <<EOF
        set network.kirchturm0='interface'
        set network.kirchturm0.ifname='l2tpeth0'
        set network.kirchturm0.proto='static'
        set network.kirchturm0.ipaddr='172.27.254.2.1/30'
        set network.kirchturm0.ip4table='66'
        set network.kirchturm0.auto='0'

        set network.kirchturm1='interface'
        set network.kirchturm1.ifname='l2tpeth1'
        set network.kirchturm1.proto='static'
        set network.kirchturm1.ipaddr='172.27.254.2.5/30'
        set network.kirchturm1.ip4table='66'
        set network.kirchturm1.auto='0'
        
        commit network

EOF
/etc/init.d/network restart
{% endhighlight %}

*Hinweise*: 

1. Die IP-Adressbereiche <code>172.27.254.2.1</code> und <code>172.27.254.2.5/30</code> sind Transit-Netze für babel-Routing. Es sind die Adressen *im* Tunnel, nicht die *äußeren Endpunktadressen*.
2. Die erzeugen Interfaces müssen wieder zur firewall, babel und batman-adv hinzugefügt werden. Das spare ich mir hier - das geht genau so wie bei fastd-Verbindungen (siehe oben).
3. Das Setup ist noch ein wenig bugged - die Tunnel starten beim Boot nicht. Workaround <code>/etc/init.d/l2tp-tunnel start</code> in /etc/rc.local eintragen.

### 6. OpenWRT ohne Webgui

Mein TP-Link WDR3500 hat 8 MB Flash-Speicher - einige Geräte (z.B TP-Link TL-WR841n) haben nur 4 MB. Wenn Du auf OpenVPN und Tinc verzichtest (d.h. babel und pptp verwendest), kannst Du mit dem OpenWRT Image-Builder auch OpenWRT mit den notwendigen Paketen für kleinere Geräte bauen.

{% highlight bash%}
# Auf dem Laptop ausführen - nicht unter OpenWRT
# Download
wget http://downloads.openwrt.org/chaos_calmer/15.05/ar71xx/generic/OpenWrt-ImageBuilder-15.05-ar71xx-generic.Linux-x86_64.tar.bz2
# Entpacken
tar xjf OpenWrt-ImageBuilder-15.05-ar71xx-generic.Linux-x86_64.tar.bz2
cd OpenWrt-ImageBuilder-15.05-ar71xx-generic.Linux-x86_64
# Beispiel fuer TL-WR841n - make info zeigt alle Optionen
make image PROFILE="TLWR841" PACKAGES="ip-full babeld kmod-batman-adv batctl fastd ppp-mod-pptp kmod-nf-nathelper-extra kmod-l2tp kmod-l2tp-eth kmod-l2tp-ip"
 
{% endhighlight %}

## Fazit

Du hast bis hierhin durchgehalten. Glückwunsch. In Teil 1 und Teil 3 habe ich Dir gezeigt, wie Du Nodes für ein Freifunk-Netz bauen kannst. In Teil 2 habe ich aus der Geschichte von Freifunk-KBU erzählt. Die Bash-Scripts aus diesen Artikel sind noch nicht "rund". Ich hab' diesmal auch darauf verzichtet, sie in ein git zu stellen, da es lose Snipplets sind, die angepasst werden müssen.

Egal zu welcher Freifunk-Community Du gehörst oder ob Du eine gründen möchtest: Du hast hier Wissen bekommen, dass Dir auch dabei hilft Gluon zu verstehen. Diese Blog-Artikel sagen nichts darüber aus, welche Hardware wie viel schafft oder wie Du die Bash-Scripte und Snipplets am besten verteilst. Was soll davon in eine Freifunk-Firmware? Finde es heraus.

Einige Dinge fehlen hier, da sie mit Nodes an sich wenig zu tun haben. Schreib Du doch mal einen Blog-Artikel zum Monitoring via SSH, collectd, DNS, IPv6, map-Anzeige oder irgendetwas anderem.