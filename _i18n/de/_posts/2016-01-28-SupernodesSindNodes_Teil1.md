---
layout: default
title: "Supernodes sind Nodes"
author: "Frank Nord"
date: 2016-02-01 00:00:00
---
# Nicht als Server gedacht - Teil 1

Freifunk Nodes bestehen aus *Nodes*, den einzelnen Knoten.
*Supernodes sind Nodes* - keine zentralen Server. Denk daran.

Diese Serie besteht aus 3 Teilen. Teil 1 ist ein Howto zu Supernodes und Nodes. Teil 2 geht auf Dezentralisierung und die Probleme des KBU Netzes im Dezember / Januar ein. Teil 3 gibt einen technische Ausblick. Dies ist Teil 1.

## Wie baut man ein Freifunk-Netz aus WLAN-Routern?

Speicherplatz, Arbeitsspeicher und CPU-Leistung sind auf WLAN-Routern sehr begrenzt.

<!--break-->

Nimm TP-Link TP-WR841n als Beispiel. Er ist günstig (ca. 15 €), hat aber nicht genug Ressourcen für Verschlüsselung und Routing - es gibt einfach zu wenig Speicherplatz um die notwendige Software zu installieren. Dennoch ist er sehr populär, da er günstig ist.

Oder nimm den TP-Link TP-WR842nd als Beispiel. Er ist nicht ganz so günstig (ca. 30 €), hat aber doppelt so viel Speicherplatz und einen USB-Port. Alix und APU boards sind weitaus teurer, haben aber auch deutlich mehr CPU-Leitung, Arbeitsspeicher und Speicherplatz.

Freifunk-Netze sind daher nicht einheitlich: Kleine Geräte machen nicht viel - sie sind einfach zu schwach. Andere haben genug Kapazität um VPN-Tunnel zu verschlüsseln oder Routing-Daemons zu starten. Damit gibt es zwei Kategorien:

- *Nodes* sind kleinere Geräte mit begrenzten Ressourcen
- *Supernodes* sind größere Geräte, die Traffic routen.

Das macht Supernodes offensichtlich interessant. Wenn Du jedoch nur wenig Geld ausgeben willst oder eine große Fläche abdecken möchtest, sind Nodes jedoch auch Option.

## Die Fahrt beginnt
Hier erfährst, wie Du einen Node oder einen Supernode aufsetzen kannst.

Im Prinzip ist es egal, welche Hardware du verwendest - einige Supernodes laufen beispielsweise auf Server-Hardware. 
In diesem Tutorial gehe ich aber davon aus, dass Du vor einem OpenWRT WLAN-Router sitzt. Ich verwende hier einen TP-Link WDR3500 (ca. 35 €).

Die Installation ist nicht schwer, aber aufwendig. Fehler passieren schnell.

* Verwende das Kommando <code>logread</code> und sehe damit wo es klemmt
* Alle Einstellung kannst Du per *Copy & Paste* in Deine SSH-Sitzung übertragen - es gibt aber auch Shell-Scripts: <a href="https://github.com/franknord/node-scripts">https://github.com/franknord/node-scripts</a>)

Unser Fahrplan ist recht übersichtlich. Zuerst richte ich einen Node ein, danach mache ich ihn zum Supernode. Am Ende ziehe kommt ein Fazit.
Konkret:

1. Node aufsetzen
 0. Voraussetzungen
 1. Software installieren
 2. WLAN und Netzkwer konfigurieren
 3. Firewall Regeln setzen
2. Den Node zum Supernode machen
 1. Software installieren
 2. IP-Adressen zuweisen
 3. DHCP-Server konfigurieren
 4. Routing einrichten
 5. Internet-Zugang über VPN (hide.me) freigeben
 6. Das KBU-Backbone VPN (Tinc) konfigurieren
3. Fazit


## Einen Node aufsetzen
### 0. Voraussetzungen
Ein paar Voraussetzungen gibt es.

1. Auf dem WLAN-Router läuft OpenWRT 15.05 ("*Chaos Calmer*")
2. Du hast ein Kennwort gesetzt und bist per SSH verbunden.
3. Der Router ist mit dem Internet verbunden.

Weiterhin sollte der Router:

* Nicht weiter konfiguriert sein
* Mehrere WLAN-Netze gleichzeitig (Virtual AP - VAP) auf einem Radio unterstützen

Falls Du den Router bereits weiter konfiguriert hast, ist das grundsätzlich kein Problem. Da ich jedoch nicht voraussehen kann, was Du geändert hast, kann es im Einzelfall zu Konflikten kommen.
Viele Router (TP-Link Serie, usw.) unterstützen VAP. Falls Du Dir nicht sicher bist, sehe im OpenWRT-Wiki nach, was Dein Router kann. 


### 1. Software installieren

Der Node benötigt batman-adv. Es wird mittels opkg installiert. (https://github.com/franknord/node-scripts/blob/master/node/01_install_software.sh )
{% highlight bash %}
opkg update
opkg install kmod-batman-adv batctl 
batctl -v

{% endhighlight %}

Wenn alles ok ist, gibt das letzte Kommando die Version aus: <code>batctl 2014.4.0 [batman-adv: 2014.4.0]</code>.

### 2. WLAN- und Netzwerk-Konfiguration

Es gibt zwei Netzwerke:

* Ein Accesspoint mit SSID *Freifunk*
* Ein Ad-Hoc Netz mit IBSSID / EBSSID <code>42:42:42:42:42</code>.

Verwende <code>uci</code> um die Konfigration anzupassen. Führe dazu folgende Kommandos via SSH aus (https://github.com/franknord/node-scripts/blob/master/node/02_wlan_lan.sh ).

*Hinweis*: Wenn Du bereits ein WLAN konfiguriert hast, entferne die Zeile <code>delete wireless.@wifi-iface[0]</code> aus der Liste. Dein WLAN bleibt bestehen.

{% highlight bash %}
uci -q batch <<EOF
        delete wireless.radio0.disabled 				# WLAN Einschalten
        delete wireless.@wifi-iface[0]					# OpenWRT-Default WLAN loeschen
        set wireless.radio0.channel='1'					# Funkeinstellungen
        set wireless.radio0.htmode='HT20'
        set wireless.radio0.country='DE'
        
        set wireless.wifi_freifunk='wifi-iface'			# 1. WLAN: Accesspoint
        set wireless.wifi_freifunk.device='radio0'
        set wireless.wifi_freifunk.network='freifunk'
        set wireless.wifi_freifunk.mode='ap'
        set wireless.wifi_freifunk.ssid='Freifunk'
        
        set wireless.wifi_mesh='wifi-iface'				# 2. WLAN: Ad-Hoc Mesh
        set wireless.wifi_mesh.device='radio0'
        set wireless.wifi_mesh.network='mesh'
        set wireless.wifi_mesh.mode='adhoc'
        set wireless.wifi_mesh.ssid='42:42:42:42:42:42'
        set wireless.wifi_mesh.bssid='42:42:42:42:42:42'
        set wireless.wifi_mesh.mcast_rate='12000'
        commit wireless

        set batman-adv.bat0.gw_mode='client'			# Batman-adv: Router ist Node - kein Supernode
        set batman-adv.bat0.orig_interval='5000'		# Beacon alle 5 Sekunden senden
        set batman-adv.bat0.bridge_loop_avoidance='1'	# Bride Loop-Avoidance Feature einschalten
        commit batman-adv

        set network.bat0='interface'					# Interface bat0 (batman-adv) im System bekannt machen
        set network.bat0.proto='none'
        set network.bat0.ifname='bat0'

        set network.freifunk='interface'				# Interface "Freifunk" im System bekannt machen
        set network.freifunk.ifname="bat0"				# Enhaelt als Bridge bat0 und den Freifunk-AP (siehe wireless)
        set network.freifunk.type='bridge'				
        set network.freifunk.proto='none'				# Keine IP usw. setzen.
        set network.freifunk.auto='1'
        
        set network.mesh='interface'					# Mesh als Interface im System bekannt machen
        set network.mesh.proto='batadv'					# Nutze batman-adv
        set network.mesh.mtu='1532'						# MTU ist seit batman-adv 2014.0: 1532 Bytes
        set network.mesh.mesh='bat0'					# Nutze das bat0 Interface fuer das Mesh
        commit network
EOF
/etc/init.d/network restart
{% endhighlight %}


### 3. Firewall-Konfiguration

Aus Sicherheitsgründen muss das Freifunk-Netz abgeschirmt werden. ICMP und IGMP sind aber erlaubt (https://github.com/franknord/node-scripts/blob/master/node/03_firewall.sh ):

{% highlight bash %}
uci -q batch <<EOF
        add firewall zone
        set firewall.@zone[-1].forward='ACCEPT'
        set firewall.@zone[-1].output='ACCEPT'
        set firewall.@zone[-1].input='REJECT'
        set firewall.@zone[-1].network='bat0 freifunk mesh kbubackbone'
        set firewall.@zone[-1].mtu_fix='1'
        set firewall.@zone[-1].name='freifunk'

        add firewall rule 
        add firewall rule 

        set firewall.@rule[-1].name='Allow ICMP (Mesh)'
        set firewall.@rule[-1].src='freifunk'
        set firewall.@rule[-1].proto='icmp'                     
        set firewall.@rule[-1].family='ipv4'                    
        set firewall.@rule[-1].target='ACCEPT'                  

        set firewall.@rule[-2].name='Allow IGMP (Mesh)'
        set firewall.@rule[-2].src='freifunk'
        set firewall.@rule[-2].proto='igmp'                     
        set firewall.@rule[-2].family='ipv4'                    
        set firewall.@rule[-2].target='ACCEPT'                  

        commit firewall
EOF
/etc/init.d/firewall restart
{% endhighlight %}

### Zwischenstand

Der erste Teil ist geschafft: Das WLAN läuft, aber der Router verteilt noch keine IP-Adressen. Wenn ein Supernode in Funkreichweite ist, erreichst Du ihn aber und bekommst von dort eine IP-Adresse zugewiesen.



## Den Node zum Supernode machen

Nun wird es komplizierter. Vor Einrichtung des Supernodes musst Du Dir ein paar Gedanken machen:

* *Welche* IP-Adressen soll der Supernode verteilen?
* Wie soll der Supernode routen?
 * Wie werden Pakete zu anderen Freifunk-Supernodes übertragen?
 * Sollen Clients auf das Internet zugreifen können? Und wie?

In diesem Blog-Artikel mache ich es mir einfach. Zu anderen Supernodes nutze ich das Backbone-VPN der KBU-Community routed. Das Internet erreiche ich über einen VPN-Tunnel bei https://hide.me - das KBU-VPN wird verwendet, wenn hide.me nicht verfügbar ist.

Es gibt viele Alternativen: Du kannst das Intercity-VPN oder auch babel und das ad-hoc Netz verwenden um anderen Supernodes zu erreichen. Wenn Du Erfahrung mit Abuse-Handling hast, kannst Du Deinen Internet Zugang auch direkt freigeben. 

### 1. Software installieren

Der Supernode braucht zusätzlich ip, openvpn und tinc (https://github.com/franknord/node-scripts/blob/master/supernode/01_install_software.sh ).
{% highlight bash %}
opkg install openvpn-openssl tinc ip git
{% endhighlight %}

### 2. IP-Adressen und Subnet

Wie bei freifunk.net gibt es auch bei KBU eine Wiki für IP-Adressen. https://kbu.freifunk.net/wiki/index.php?title=IP_Subnetze
Grundsätzlich kannst Du Dir einen freien IP-Adressbereich suchen und dort eintragen.
Leider ist die Seite zur Zeit nicht aktuell - frag einfach auf der Mailingliste und helf mit die Seite aufzumöbeln.

Ich verwende hier *172.27.8.0/25, d.h. 172.27.8.0 - .127*. Das musst Du anpassen.

Die IP-Adresse musst Du auf dem Freifunk-Interface konfigurieren. Da das Gerät nun routed (https://github.com/franknord/node-scripts/blob/master/supernode/02_ip_addresses.sh ).
{% highlight bash %}
uci -q batch <<EOF
		set network.freifunk.proto='static'
		set network.freifunk.ipaddr='172.27.8.1'
		set network.freifunk.netmask='255.255.255.128'
		commit network
EOF
/etc/init.d/network restart
{% endhighlight %}

### 3. DHCP-Server konfigurieren

Für das Freifunk-Interface muss ein DHCP-Server konfiguriert und in der Firewall erlaubt werden (https://github.com/franknord/node-scripts/blob/master/supernode/03_dhcp.sh ).

{% highlight bash %}
uci -q batch <<EOF
	set dhcp.freifunk='dhcp'
	set dhcp.freifunk.interface='freifunk'
	set dhcp.freifunk.start='2'
	set dhcp.freifunk.limit='125'
	set dhcp.freifunk.leasetime='10m'
    set dhcp.freifunk.dhcpv6='disabled'
	set dhcp.freifunk.ra='disabled'
	set dhcp.freifunk.dhcp_option='6,172.27.255.3' # Freifunk-KBU: Paul
	commit dhcp

    set batman-adv.bat0.gw_mode='server'            # Batman-adv: Router ist Server, da DHCP
    commit batman-adv

	add firewall rule 
	
    set firewall.@rule[-1].name='Allow DHCP request (Mesh)'
    set firewall.@rule[-1].src='freifunk'
    set firewall.@rule[-1].dest_port='67-68'
    set firewall.@rule[-1].proto='udp'
    set firewall.@rule[-1].target='ACCEPT'
    set firewall.@rule[-1].family='ipv4'   

    commit firewall
EOF
/etc/init.d/dnsmasq restart
/etc/init.d/firewall restart
{% endhighlight %}

### 4. Policy Routing einrichten

Da Traffic aus dem Mesh anders routed werden soll als lokaler traffic, müssen Policies definiert werden.
Der genutzte IP-Adressbereich muss wieder angepasst werden (https://github.com/franknord/node-scripts/blob/master/supernode/04_routing.sh ).
{% highlight bash %}
uci -q batch <<EOF
	add network rule
	add network rule

	set network.@rule[-1].in='freifunk'
	set network.@rule[-1].lookup='66'

	set network.@rule[-3].dest='172.27.8.0/25' # Anpassen!
	set network.@rule[-3].lookup='66'
	commit network
EOF
/etc/init.d/network restart
{% endhighlight %}


### 5. Hide.me VPN: Internet freigeben

Hide.me benötigt ein tun-Device mit Firewall-Zone für das Masquerading (https://github.com/franknord/node-scripts/blob/master/supernode/05a_hideme.sh ).

{% highlight bash %}
uci -q batch <<EOF
	set network.hideme='interface'
	set network.hideme.proto='none'
	set network.hideme.ifname='tun-hideme'
	commit network

    add firewall zone
    set firewall.@zone[-1].forward='REJECT'
    set firewall.@zone[-1].output='ACCEPT'
    set firewall.@zone[-1].input='REJECT'
    set firewall.@zone[-1].network='hideme'
    set firewall.@zone[-1].mtu_fix='1'
    set firewall.@zone[-1].masq='1'
    set firewall.@zone[-1].name='hidemezone'

    add firewall forwarding 
    set firewall.@forwarding[-1].src='freifunk'
	set firewall.@forwarding[-1].dest='hidemezone'
	commit firewall

EOF
/etc/init.d/network restart
/etc/init.d/firewall restart
{% endhighlight %}

Nachdem das Interface vorhanden und registiert ist, erstelle ich das Verzeichnis <code>/etc/hide.me/</code>. Nun lege ich Konfiguration und Zertifikat dort ab. Dabei enthält <code>login</code> meine (inzwischen geänderten) hide.me-Zugangsdaten.

{% highlight bash %}
$ ls -l /etc/hide.me/
-rwxr-xr-x    1 root     root           526 Jan 24 20:00 Roosendaal.ovpn
-rwxr-xr-x    1 root     root          1367 Jan 24 15:42 TrustedRoot.pem
-rwxr-xr-x    1 root     root            94 Jan 24 20:07 down.sh
-rwx------    1 root     root            27 Jan 24 16:29 login
-rwxr-xr-x    1 root     root            95 Jan 24 20:07 up.sh
$ cat /etc/hide.me/login 
hideme_test
03aanLp58UNv
{% endhighlight %}

Die Dateien <code>up.sh</code> erledigt das setzen der Default-Route. Sie wird so erstellt (https://github.com/franknord/node-scripts/blob/master/supernode/05b_hideme.sh ):
{% highlight bash %}
cat > /etc/hide.me/up.sh <<EOF
#!/bin/sh
ip route add 0.0.0.0/1 table 66 dev \$dev
ip route add 128.0.0.0/1 table 66 dev \$dev 
EOF
chmod 755 /etc/hide.me/up.sh
{% endhighlight %}


Die Konfiguration (hier: <code>Roosendaal.ovpn</code>) wird geändert. Ergebnis:
{% highlight bash %}
client
dev tun-hideme                          # Interface-Name angepasst - passt zu /etc/config/network/
proto udp
remote free-nl.hide.me 3478
cipher AES-128-CBC
resolv-retry infinite
nobind
persist-key
persist-tun
mute-replay-warnings
ca /etc/hide.me/TrustedRoot.pem         # Pfad angepasst - Muss absolut sein
verb 1                                  # Weniger Logging
auth-user-pass /etc/hide.me/login       # Verweis auf Login-Daten
reneg-sec 0
remote-cert-tls server
verify-x509-name "*.hide.me" name
route-nopull                            # Aufgenommen - keine Default-Route
script-security 2 						# Aufgenommen - Default-Route manuell setzen
up /etc/hide.me/up.sh 					# Aufgenommen - Default-Route manuell setzen

{% endhighlight %}
Mit <code>openvpn --config /etc/hide.me/Roosendaal.ovpn</code> kannst Du testen, ob die Einwahl soweit funktioniert. 

Zuletzt muss die OpenVPN Instanz in uci registriert werden, damit die Einwahl automatisch erfolgt (https://github.com/franknord/node-scripts/blob/master/supernode/05c_hideme.sh ).

{% highlight bash %}
uci -q batch <<EOF
	set openvpn.hideme_config='openvpn'
	set openvpn.hideme_config.enabled='1'
	set openvpn.hideme_config.config='/etc/hide.me/Roosendaal.ovpn'
	commit openvpn
EOF
/etc/init.d/openvpn restart
{% endhighlight %}

### 6. Tinc konfigurieren

Tinc baut die Verbindung zum KBU-Backbone auf. Das Tinc-Setup ist etwas komplizierter. Es gibt doch ein paar Schritte:

1. Vorbereiten der Verzeichnisse und herunterladen fremder Public-Keys
2. Erstellen der Konfiguration
3. Public-Key erzeugen und verteilen
4. Routing für Tinc erstellen
5. Tinc-Instanz in UCI registrieren

#### Vorbereiten der Verzeichnisse und Herunterladen der Public-Keys 

Zunächst musst Du ein Verzeichnis für die Tinc-Konfiguration vorbereiten und die existierenden Hosts dort hinterlegen.
(https://github.com/franknord/node-scripts/blob/master/supernode/06a_tinc.sh ).
{% highlight bash %}
mkdir /etc/tinc/kbubackbone
cd /etc/tinc/kbubackbone
git clone git://github.com/ff-kbu/bbkeys.git hosts
{% endhighlight %}

#### Erstellen der Konfiguration
Um Dich per Tinc zu verbinden, musst auf auf der Mailingliste fragen, wer bereit wäre mir Dir zu peeren. Da Tinc ein dezentrales System ist, kann jeder mit Dir peeren, der Tinc bereits installiert hat. Weiterhin musst Du einen Namen für Deinen Supernode wählen. Ich nutze hier *mein_neuer_supernode*. 

In diesem Beispiel geben die admins von Paul und Paula ihr Ok. Sie sind meine Peering-Partner. Nun müssen Konfiguration und Public Key erstellt werden. (https://github.com/franknord/node-scripts/blob/master/supernode/06b_tinc.sh ).

{% highlight bash %}
# Name anpassen!
cat > /etc/tinc/kbubackbone/hosts/mein_neuer_supernode <<EOF
Subnet=172.27.8.0/25
Compression=11
Cipher=aes-256-cbc 
EOF

# Name anpassen!
cat > /etc/tinc/kbubackbone/tinc.conf <<EOF
Mode =  Router
ConnectTo = paul
ConnectTo = paula
Name =  mein_neuer_supernode
Device= /dev/net/tun
EOF
{% endhighlight %}

#### Public-Key erzeugen 

Zunächst muss der Public-Key erstellt werden

{% highlight bash %}
# Public Key erstellen
# Fragen nach dem Speicherort mit <ENTER> quittieren
tincd -n kbubackbone -K 
{% endhighlight %}

### ... und verteilen
Den erstellten Public-Key musst Du nun bekannt machen. Da die keys in einem git-Repository verwaltet werden, verwende ich dazu einen Patch.

Die ganze Dinge musst Du natürlich anpassen - Du bist ja nicht Frank Nord.

(https://github.com/franknord/node-scripts/blob/master/supernode/06c_tinc.sh ).


{% highlight bash %}
# Patch erstellen
# Git konfigurieren - Anpassen (!)
git config --global user.name "Frank Nord"
git config --global user.email "frank.nord@mailbox.org"

cd /etc/tinc/kbubackbone/hosts/
git add mein_neuer_supernode
git commit -a -m "Added mein_neuer_supernode"
git format-patch HEAD~..HEAD -o /tmp/
cat /tmp/0001-Added-mein_neuer_supernode.patch
# /tmp/0001-Added-mein_neuer_supernode.patch
{% endhighlight %}

Die erstellte Datei <code>/tmp/0001-Added-mein_neuer_supernode.patch</code> kannst Du an Deine Peering-Partner senden.
Falls Dein Supernode fester Bestandteil des Netzes werden soll, stelle einen Pullrequest.

#### Routing Konfiguration für Tinc erstellen
Beim Start bzw. Stop von tinc müssen passenden Routes eingetragen werden.  Der IP-Range muss wieder angepasst werden.
Die anderen IP-Ranges <code>172.26.0.0/15</code> und <code>10.158.0.0/15</code> richten sich dabei nach dem KBU-Netz (https://github.com/franknord/node-scripts/blob/master/supernode/06d_tinc.sh ).

{% highlight bash %}
cat > /etc/tinc/kbubackbone/tinc-up <<EOF
#!/bin/sh
ifconfig 172.27.8.1 netmask 255.255.255.255 \$INTERFACE up
ip route add 172.26.0.0/15 dev \$INTERFACE table 66 
ip route add 10.158.0.0/15 dev \$INTERFACE table 66 
ip route add 172.26.0.0/15 dev \$INTERFACE 
ip route add 10.158.0.0/15 dev \$INTERFACE 
ip route add default dev \$INTERFACE table 66 
ip route add 172.27.8.0/25 dev br-freifunk table 66 
EOF

chmod 755 /etc/tinc/kbubackbone/tinc-up
{% endhighlight %}


#### In UCI registrieren
Nun trage ich die Tinc-Instanz noch in UCI ein, damit sie automatisch gestartet wird (https://github.com/franknord/node-scripts/blob/master/supernode/06e_tinc.sh ).

{% highlight bash %}
uci -q batch <<EOF
	set tinc.kbubackbone='tinc-net'
	set tinc.kbubackbone.enabled='1'
	set tinc.kbubackbone.Name='mein_neuer_supernode' # Anpassen!
	commit tinc

	set network.kbubackbone='interface'
	set network.kbubackbone.proto='none'
	commit network
EOF
/etc/init.d/network restart
/etc/init.d/tinc restart
{% endhighlight %}

## Fazit

Der Supernode ist nun konfiguriert. Zu vielen Dingen hab' ich nur wenig gesagt. Frag auf der Mailinglist, falls Dir Dinge unklar sind. Auch bei DNS hab' gespart: Ein eigener resolver wäre besser als ein Verweis auf 172.27.255.3 (Paul).

Das Ausführen der Shell-Befehle ist sicher mühselig. Anderseits hast Du genau gesehen, was einen Supernode ausmacht und welche Dinge konfiguriert werden müssen. Bau einen Supernode und spiel damit. Dann werden viele Dinge klar. 

Technisch richtet sich der Artikel nach dem Status Quo. Zum Beispiel wird Tinc als Backbone-VPN verwendet und es werden keine neuen Dinge eingeführt. Es wäre cool, tinc durch babel und fastd zu erstzen. Das wird Bestandteil von *Teil 3* - also eins nach dem anderen.

Im nächsten Blog-Post *Nicht als Server gedacht - Teil 2* geht es erst einmal um kaputte Dinge und Konsequenzen.

### Und IPv6?

Zu IPv6 kann ich leider keine Schritt-für-Schritt Anleitung schreiben.

* Es gibt kaum IPv6-Tunnel anbieter, die benutzbare VPN-Tunnel anbieten. Die Konfigration unterscheidet sich bei allen.
* OpenVPN hat noch keine <code>push redirect-gateway</code>-Option für IPv6.
* Viele Fragen bei der IPv6-Adressvergabe sind für mich offen:
 * Welche Konsequenzen hat der fehlende IPv6 Gateway-Mode in batman-adv?
 * Wie sollen Public IPv6-Netze vergeben werden? Wie findet die Zurordnung zwischen Supernode mit passendem Tunnel und Client statt?
 * Sollen ULA IPv6-Adressen vergeben werden? Wie kommen Anwendungen mit nat66 - insb. bei Roaming - zurecht?
 * In welchen Netzen (ad-hoc, Infrastuktur, VPN-Strecken) werden Adressen wie verteilt? Stateless / Stateful Autoconfiguration? Prefix Delegation?

Damit ist IPv6 leider noch kein Thema für ein Supernode-Tutorial - aber spannendes Feld für Experimente. 😎