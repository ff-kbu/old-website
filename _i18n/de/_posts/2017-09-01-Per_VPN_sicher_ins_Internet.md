---
layout: default
title: "VPN-Server im Eigenbau"
author: "Frank Nord"
date: 2017-09-01 21:00:00
---
## Unverschlüsseltes Funknetz

Freifunk ist unverschlüsselt – Datenpakete werden im Klartext über den Äther gesendet.  Alle Stationen in Funkreichweite 
können leicht abhören, welche Internetangebote genutzt werden.

Ein eigener VPN-Server bietet die Chance Daten verschlüsselt nach Hause zu übertragen und vor Angreifern im Äther zu schützen.
Doch wie kannst Du Deinen eigenen VPN-Server aufsetzen? Ich beschreib's mal mit OpenVPN und LEDE:

<!--break-->

## VPN: Idee und Setup

{% include image_small.html src="vpn-setup.jpg" %}
Der VPN-Router wird parallel zum Freifunk-Router aufgebaut: Die LAN-Ports werden verbunden, 
die WAN-Ports beide in den Internet-Router (z.B. die Fritzbox) gesteckt. Das gehört zum Setup:

* <a href="https://de.wikipedia.org/wiki/Virtual_Private_Network">VPN</a> steht für Virtual Private Network. Das virtuelle private Netzwerk besteht aus einem Tunnel indem Daten verschlüsselt und sicher zwischen verschiedenen Geräten transportiert werden. Der Tunnel wird innerhalb des Freifunk-Netzes aufgebaut - Zugriff haben nur die eigenen Geräte.

* <a href="https://de.wikipedia.org/wiki/OpenVPN">OpenVPN</a> verwaltet das virtuelle Netz. OpenVPN wird als Service gestartet und verbindet die teilnehmenden Geräte. Dabei konfiguriert es Netzwerk- und Verschlüsselungsparameter.
Clients gibt es für fast alle Betriebssysteme (Linux, <a href="https://sourceforge.net/projects/openvpn-gui/">Windows</a>, <a href="https://itunes.apple.com/de/app/openvpn-connect/id590379981">iOS</a>, <a href="https://tunnelblick.net/">OS X</a>, <a href="https://play.google.com/store/apps/details?id=de.blinkt.openvpn">Android</a>, ...).


* Ein weiterer Router (z.B. TP-Link TL-WR842nd) als VPN-Server mit dem OpenWRT Nachfolger <a href="https://lede-project.org/">LEDE</a>. Standardmäßig gibt es für OpenWRT-basierte Gluon-Firmwares keine aktuellen OpenVPN Pakete. Da OpenSSL verwendet wird, brauchst Du ein Gerät mit 8 MB Flash. Alternativ kannst Du ein Lede-Image ohne Luci mit dem Image-Builder erstellen.

Zum Aufbau sind 2 Schritte notwendig:

1. Vorbereitung: Der Router wird konfiguriert und *danach* wie auf auf dem Foto verkabelt.
2. OpenVPN Konfiguration: Der OpenVPN-Daemon wird als Server und Dienst im Freifunk-Netz eingerichtet.

## Vorbereitung des VPN-Routers

Bevor Du den Router wie auf dem Foto verkabeln kannst, musst Du ihn erst vorbereiten. Hierzu verbinde zunächst den LAN-Port
des Routers mit Deinem Notebook (o.ä.).

<a href="https://lede-project.org/docs/guide-quick-start/start">Flash LEDE</a> und *setze ein Kennwort*. 
Installiere als nächstes die Software und konfiguriere Firewall und Netzwerk. Alle Dinge passieren über die <a href="https://lede-project.org/docs/guide-quick-start/sshadministration">SSH command line</a>.

### 1. Software installieren

Installiere die notwendigen Pakete mit opkg – führe folgende Befehle per SSH aus:

```
root@LEDE:~# opkg update
root@LEDE:~# opkg install openvpn-openssl openvpn-easy-rsa haveged
root@LEDE:~# /etc/init.d/haveged start
```

### 2. Firewall anpassen

Die Firewall verhindert, dass Pakete aus dem Freifunk Netz (LAN-Ports) nicht direkt ins Internet gesendet werden. 
Hierzu wird eine neue Firewall-Zone `freifunk` erstellt. Sie enthält die LAN-Ports mit zugehörigem Netz. 
Das VPN-Interface wird der alten LAN-Zone zugeordnet.

```
root@LEDE:~# uci -q batch <<EOF
  set firewall.@zone[0].network='vpn'
  add firewall zone
  set firewall.@zone[-1].forward='REJECT'
  set firewall.@zone[-1].output='ACCEPT'
  set firewall.@zone[-1].input='ACCEPT'
  set firewall.@zone[-1].network='lan'
  set firewall.@zone[-1].name='freifunk'
  commit firewall
EOF
/etc/init.d/firewall restart
```
Lass dich nicht verwirren: Die lan-*Zone* enthält nun das VPN-Interface – die freifunk-Zone hingegen das lan-*Interface*. ☺
Ändere aber noch nicht den Namen, da sonst die folgenden Beispiele nicht mehr funktionieren.


### 3. DHCP und radvd deaktivieren

DHCP und radvd stören im Freifunk-Netz. Sie müssen dort deaktiviert werden.

```
root@LEDE:~# uci -q batch <<EOF
  set dhcp.lan.ignore='1'
  set dhcp.lan.ra='disabled'
  set dhcp.lan.dhcpv6='disabled'c
  commit dhcp
EOF
/etc/init.d/dnsmasq restart
```

### 4. Netzwerk-Interfaces definieren

Damit der Router aus dem Freifunk-Netz erreicht werden kann, musst Du eine IP-Adresse fest zuweisen. Bitte trage die Adresse in der
<a href="https://kbu.freifunk.net/wiki/index.php?title=IP_Subnetze">Wiki</a> ein, damit sie nicht doppelt verwendet wird. Zudem braucht OpenVPN ein eigenes Interface:

```
root@LEDE:~# uci -q batch <<EOF
  set network.vpn='interface'
  set network.vpn.proto='none'
  set network.vpn.ifname='openvpn'
  set network.lan.ipaddr='10.158.0.42' # Beispiel - anpassen
  set network.lan.netmask='255.255.192.0' # Entspricht der Hood
  delete network.lan.ip6assign
  commit network
EOF
/etc/init.d/network restart
```

Mit `/etc/init.d/network restart` wird die IP-Adresse gesetzt und die SSH-Verbindung ist nicht mehr benutzbar. Du kannst den Router nun wie auf dem Foto verkabeln:

1. Verbinde die LAN-Ports der beiden Router
2. Beziehe eine neue IP-Adresse mit Deinem PC – diesmal aus dem Freifunk-Netz. Hierzu kannst Du das Kabel zu deinem Notebook oder PC kurz trennen.

Nun kannst Du den Router über Freifunk erreichen und OpenVPN konfigurieren. Ändere in Luci (Web-GUI) ruhig den
Namen des `lan`-Netzwerk-Interfaces auf `freifunk`, damit keine Verwirrung entsteht.

*Pass auf, dass der VPN-Router ab jetzt Dein privates Netzwerk nicht mehr erreichen kann – trenn die Netze.*
Beispielsweise kannst Du für das private Netz einen eigenen, weiteren Router verwenden. 
Falls nicht, sind bei einem Konfigurationsfehler oder Bug schnell private Daten gefährdet.



## OpenVPN einrichten

Die OpenVPN-Konfiguration umfasst 3 Schritte:

1. Schlüsselmaterial erzeugen
2. OpenVPN-Server konfigurieren
3. Client konfigurieren und die Verbindung testen.

### 1. Schlüsselmaterial erzeugen

Zum Erzeugen von Schlüsselmaterial und Zugangsdaten verbinde Dich erneut mit SSH und führe folgende Befehle aus. 

#### 1.1 Parameter laden
Die Programme zur Erzeugung des Schlüsselmaterials werden über Umgebungsvariablen konfiguriert. 
Lade zunächst die Parameter in die Umgebung:

```
root@LEDE:~# source /etc/easy-rsa/vars  
NOTE: If you run ./clean-all, I will be doing a rm -rf on /etc/easy-rsa/keys
```

Die Parameter müssen *immer* geladen sein, wenn Du Schlüsselmaterial bearbeitest. 
Falls Du eine neue SSH-Verbindung aufbaust (o.ä.), musst Du auch die Parameter neu laden.

#### 1.2 Certificate Authority (CA) & Hauptschlüssel instanziieren
```
root@LEDE:~# build-ca
NOTE: If you run ./clean-all, I will be doing a rm -rf on /etc/easy-rsa/keys
Generating a 2048 bit RSA private key
.............................................................................+++
.....+++
writing new private key to 'ca.key'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [US]:DE
State or Province Name (full name) [CA]:NRW
Locality Name (eg, city) [SanFrancisco]:Meine Stadt
Organization Name (eg, company) [Fort-Funston]:Meine Organisation
Organizational Unit Name (eg, section) [MyOrganizationalUnit]:Meine Sektion
Common Name (eg, your name or your server's hostname) [Fort-Funston CA]:Meine CA
Name [EasyRSA]:
Email Address [me@myhost.mydomain]:someone@somewhere.com
```

### 1.3 Router-Schlüssel erzeugen
Zuerst die Diffie-Hellman Gruppe: Dies dauert *sehr lange*, da viele Primzahl-Tests ausgeführt werden. 
Du kannst den Generator im Hintergrund laufen lassen und mit den nächsten Schritten weiter machen. *Vergiss ggf. nicht die Parameter neu zu laden* (vgl. 1.1 Parameter laden).

Da die Gruppe nicht geheim ist, kannst Du Sie auch bedenkenlos auf einem anderen Rechner erzeugen oder wiederverwenden.

```
root@LEDE:~# build-dh
```

Danach (oder währenddessen) den RSA-Key – IP-Adresse wieder anpassen:

```
root@LEDE:~# pkitool --server 10.158.0.42
NOTE: If you run ./clean-all, I will be doing a rm -rf on /etc/easy-rsa/keys
Generating a 2048 bit RSA private key
...................................................................................................+++
.............+++
writing new private key to '10.158.0.42.key'
-----
Using configuration from /etc/easy-rsa/openssl-1.0.0.cnf
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
countryName           :PRINTABLE:'US'
stateOrProvinceName   :PRINTABLE:'CA'
localityName          :PRINTABLE:'SanFrancisco'
organizationName      :PRINTABLE:'Fort-Funston'
organizationalUnitName:PRINTABLE:'MyOrganizationalUnit'
commonName            :PRINTABLE:'10.158.0.42'
name                  :PRINTABLE:'EasyRSA'
emailAddress          :IA5STRING:'me@myhost.mydomain'
Certificate is to be certified until Aug 17 18:45:21 2027 GMT (3650 days)

Write out database with 1 new entries
Data Base Updated
```

#### 1.4 Zugangsdaten & Geräteschlüssel erzeugen

Zuletzt jeweils Geräteschlüssel - hier für ein Notebook:

```
root@LEDE:~# pkitool notebook
NOTE: If you run ./clean-all, I will be doing a rm -rf on /etc/easy-rsa/keys
Generating a 2048 bit RSA private key
...........................................................................+++
.......................................+++
writing new private key to 'notebook.key'
-----
Using configuration from /etc/easy-rsa/openssl-1.0.0.cnf
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
countryName           :PRINTABLE:'US'
stateOrProvinceName   :PRINTABLE:'CA'
localityName          :PRINTABLE:'SanFrancisco'
organizationName      :PRINTABLE:'Fort-Funston'
organizationalUnitName:PRINTABLE:'MyOrganizationalUnit'
commonName            :PRINTABLE:'notebook'
name                  :PRINTABLE:'EasyRSA'
emailAddress          :IA5STRING:'me@myhost.mydomain'
Certificate is to be certified until Aug 17 18:51:54 2027 GMT (3650 days)

Write out database with 1 new entries
Data Base Updated
```

Das Schlüsselmaterial wurde nun generiert und ist auf dem Router gespeichert. 
### 2. OpenVPN Server konfigurieren

Für OpenVPN muss eine neue Konfigurationsdatei erzeugt und in uci registriert werden – IP-Adressen wieder anpassen:

```
root@LEDE:~# cat > /etc/openvpn/openvpn.conf <<EOF
  cert /etc/easy-rsa/keys/10.158.0.42.crt ## Anpassen
  key /etc/easy-rsa/keys/10.158.0.42.key ## Anpassen
  server 172.16.8.0 255.255.255.0  ## Ggf. anpassen, falls privat verwendet
  push "dhcp-option DNS 172.16.8.1" ## Muss zum IP-Bereich passen
  server-ipv6 fd2f:b51a:bcf6:acea::/64 ## Neu generieren: http://simpledns.com/private-ipv6.aspx
  port 1194
  proto udp
  dev-type tun
  dev openvpn
  keepalive 5 30
  persist-key
  persist-tun
  log /tmp/openvpn.log
  verb 3
  tun-mtu 1280
  cipher AES-256-CBC
  ca /etc/easy-rsa/keys/ca.crt
  dh /etc/easy-rsa/keys/dh2048.pem
  push "redirect-gateway"
  push "route-ipv6 2000::/3"
  tls-cipher TLS-DHE-RSA-WITH-AES-256-GCM-SHA384:TLS-DHE-RSA-WITH-AES-256-CBC-SHA256:TLS-DHE-RSA-WITH-AES-128-GCM-SHA256
EOF
```

Und registrieren:

```
root@LEDE:~# uci -q batch <<EOF
	set openvpn.vpn_config='openvpn'
	set openvpn.vpn_config.enabled='1'
	set openvpn.vpn_config.config='/etc/openvpn/openvpn.conf'
	commit openvpn
EOF
/etc/init.d/openvpn restart
```

Nun wird der OpenVPN-Server gestartet und kann hoffentlich verwendet werden.  


### 3. Abschluss und testen

Das Log liegt unter **/tmp/openvpn.log** – Beispiel:

```
Sat Aug 19 19:47:42 2017 OpenVPN 2.4.3 mips-openwrt-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4] [EPOLL] [MH/PKTINFO] [AEAD]
Sat Aug 19 19:47:42 2017 library versions: OpenSSL 1.0.2k  26 Jan 2017, LZO 2.09
Sat Aug 19 19:47:42 2017 Diffie-Hellman initialized with 2048 bit key
Sat Aug 19 19:47:42 2017 WARNING: normally if you use --mssfix and/or --fragment, you should also set --tun-mtu 1500 (currently it is 1280)
Sat Aug 19 19:47:42 2017 TUN/TAP device openvpn opened
Sat Aug 19 19:47:42 2017 TUN/TAP TX queue length set to 100
Sat Aug 19 19:47:42 2017 do_ifconfig, tt->did_ifconfig_ipv6_setup=1
Sat Aug 19 19:47:42 2017 /sbin/ifconfig openvpn 172.16.8.1 pointopoint 172.16.8.2 mtu 1280
Sat Aug 19 19:47:42 2017 /sbin/ifconfig openvpn add fd2f:b51a:bcf6:acea::1/64
Sat Aug 19 19:47:42 2017 /sbin/route add -net 172.16.8.0 netmask 255.255.255.0 gw 172.16.8.2
Sat Aug 19 19:47:42 2017 Could not determine IPv4/IPv6 protocol. Using AF_INET
Sat Aug 19 19:47:42 2017 Socket Buffers: R=[163840->163840] S=[163840->163840]
Sat Aug 19 19:47:42 2017 UDPv4 link local (bound): [AF_INET][undef]:1194
Sat Aug 19 19:47:42 2017 UDPv4 link remote: [AF_UNSPEC]
Sat Aug 19 19:47:42 2017 MULTI: multi_init called, r=256 v=256
Sat Aug 19 19:47:42 2017 IFCONFIG POOL IPv6: (IPv4) size=62, size_ipv6=65536, netbits=64, base_ipv6=fd2f:b51a:bcf6:acea::1000
Sat Aug 19 19:47:42 2017 IFCONFIG POOL: base=172.16.8.4 size=62, ipv6=1
Sat Aug 19 19:47:42 2017 Initialization Sequence Completed
```

Zudem existiert ein passenden Device:

```
root@LEDE:~# ip addr show dev openvpn
8: openvpn: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1280 qdisc fq_codel state UNKNOWN qlen 100
    link/[65534]
    inet 172.16.8.1 peer 172.16.8.2/32 scope global openvpn
       valid_lft forever preferred_lft forever
    inet6 fd2f:b51a:bcf6:acea::1/64 scope global
       valid_lft forever preferred_lft forever
```

## Client-Konfiguration

Ich nutze Debian Linux (Jessie). Hier mein Setup:

### 1. Software installieren
Auch Debian Jessie braucht Pakete.


```
root@Notebook:~# apt-get install openvpn
Reading package lists... Done
Building dependency tree       
Reading state information... Done
0 upgraded, 0 newly installed, 1 reinstalled, 0 to remove and 0 not upgraded.
Need to get 500 kB of archives.
After this operation, 0 B of additional disk space will be used.
Get:1 http://ftp.de.debian.org/debian stretch/main amd64 openvpn amd64 2.4.0-6+deb9u1 [500 kB]
Fetched 500 kB in 0s (760 kB/s)  
Preconfiguring packages ...
(Reading database ... 531491 files and directories currently installed.)
Preparing to unpack .../openvpn_2.4.0-6+deb9u1_amd64.deb ...
Unpacking openvpn (2.4.0-6+deb9u1)
Setting up openvpn (2.4.0-6+deb9u1) ...
[ ok ] Restarting virtual private network daemon.: jluehr_default.
insserv: warning: current start runlevel(s) (empty) of script `openvpn' overrides LSB defaults (2 3 4 5).
insserv: warning: current stop runlevel(s) (0 1 2 3 4 5 6) of script `openvpn' overrides LSB defaults (0 1 6).
Processing triggers for systemd (232-25+deb9u1) ...
Processing triggers for man-db (2.7.6.1-2) ...
```

### 2. Verzeichnis erstellen und Schlüsselmaterial kopieren
Zur Einwahl benötigt das Notebook einen Teil des Schlüsselmaterials vom Router:

```
root@Notebook:~# scp 10.158.0.42:/etc/easy-rsa/keys/ca.crt /etc/openvpn/freifunk_vpn/
ca.crt                                                                                  100% 1797   800.8KB/s   00:00    
root@Notebook:~# scp 10.158.0.42:/etc/easy-rsa/keys/notebook.* /etc/openvpn/freifunk_vpn/
notebook.crt                                                                            100% 5489     1.5MB/s   00:00    
notebook.csr                                                                            100% 1102   571.1KB/s   00:00    
notebook.key                                                                            100% 1704   786.3KB/s   00:00    
```

Grundsätzlich ist es besser, aber auch aufwendiger, den Notebook-Schlüssel (`notebook.key`) auf dem Notebook und nicht 
auf dem Router zu erstellen. Da Du jedoch beide Geräte kontrollierst, niemand sonst Zugang hat und jeder, der Notebook
oder Router kompromittiert direkt Zugriff zum VPN hat, habe ich hier darauf verzichtet – der Sicherheitsgewinn ist gering.

Falls Du anders vorgehen möchtest, kannst Du auch den RSA Schlüssel inkl. 
Certificate-Signing-Request (CSR) auf dem Notebook erstellen, nur den CSR zum Router übertragen und dort signieren.

In größeren Unternehmen wird das Schlüsselmaterial häufig auf verschiedenen Rechnern 
ohne Netzwerkzugang oder Smartcards erzeugt.


### 3. Client-Konfiguration erstellen

```
root@Notebook:~# cat > /etc/openvpn/freifunk_vpn/openvpn.conf <<EOF
  cert /etc/openvpn/freifunk_vpn/notebook.crt ## Ggf. anpassen
  key /etc/openvpn/freifunk_vpn/notebook.key ## Ggf. anpassen
  ca /etc/openvpn/freifunk_vpn/ca.crt
  client
  dev-type tun
  dev freifunk-vpn
  proto udp
  remote 10.158.0.42 1194 # Anpassen
  resolv-retry infinite
  nobind
  tun-mtu 1280
  cipher AES-256-CBC
  ns-cert-type server
  tls-cipher TLS-DHE-RSA-WITH-AES-256-GCM-SHA384:TLS-DHE-RSA-WITH-AES-256-CBC-SHA256:TLS-DHE-RSA-WITH-AES-128-GCM-SHA256
EOF
```

### 4. Verbindung zum Server starten
Nun kannst Du Dich zum Server verbinden:

```
root@Notebook:~# openvpn --config /etc/openvpn/freifunk_vpn/openvpn.conf
Sat Aug 19 22:17:50 2017 OpenVPN 2.4.0 x86_64-pc-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4] [EPOLL] [PKCS11] [MH/PKTINFO] [AEAD] built on Jun 22 2017
Sat Aug 19 22:17:50 2017 library versions: OpenSSL 1.0.2l  25 May 2017, LZO 2.08
Sat Aug 19 22:17:50 2017 WARNING: normally if you use --mssfix and/or --fragment, you should also set --tun-mtu 1500 (currently it is 1280)
Sat Aug 19 22:17:50 2017 TCP/UDP: Preserving recently used remote address: [AF_INET]10.158.0.42:1194
Sat Aug 19 22:17:50 2017 UDP link local: (not bound)
Sat Aug 19 22:17:50 2017 UDP link remote: [AF_INET]10.158.0.42:1194
Sat Aug 19 22:17:51 2017 [10.158.0.42] Peer Connection Initiated with [AF_INET]10.158.0.42:1194
Sat Aug 19 22:17:52 2017 Note: option tun-ipv6 is ignored because modern operating systems do not need special IPv6 tun handling anymore.
Sat Aug 19 22:17:53 2017 TUN/TAP device freifunk-vpn opened
Sat Aug 19 22:17:53 2017 do_ifconfig, tt->did_ifconfig_ipv6_setup=1
Sat Aug 19 22:17:53 2017 /sbin/ip link set dev freifunk-vpn up mtu 1280
Sat Aug 19 22:17:53 2017 /sbin/ip addr add dev freifunk-vpn local 172.16.8.6 peer 172.16.8.5
Sat Aug 19 22:17:53 2017 /sbin/ip -6 addr add fd2f:b51a:bcf6:acea::1000/64 dev freifunk-vpn
Sat Aug 19 22:17:53 2017 add_route_ipv6(2000::/3 -> fd2f:b51a:bcf6:acea::1 metric -1) dev freifunk-vpn
Sat Aug 19 22:17:53 2017 Initialization Sequence Completed
```

Hier schafft mein TP Link TL-WR842nd v2 allein knapp 10 MBit/s – etwa so viel wie mein Internet-Upstream.
Wenn Du magst, kannst Du openvpn auch über systemd starten oder in den <a href="https://torguard.net/knowledgebase.php?action=displayarticle&id=53">Network Manager</a> eintragen.

Für andere Betriebssysteme sind einige Anpassungen nötig. Beispielsweise muss auf Windows die Konfiguration auf `.ovpn` enden und routes müssen mit `route-method exe` gesetzt werden.

Achtung: Die Konfiguration ist nicht *wasserdicht*. 
Falls z.B. das VPN kurz ausfällt oder ein Angreifer DHCPv6-Server betreibt, bist Du verwundbar. 
Für einen besseren Schutz brauchst Du eine Firewall, die fast alle unverschlüsselten, ausgehenden Verbindungen blockiert. <a href="https://github.com/yanosz/shorewall_example">Beispiel für shorewall</a>

OpenVPN muss zudem hin- und wieder mit Sicherheitsupdates versorgt werden. Informationen gibt es z.B. auf den Mailinglists zu <a href="https://sourceforge.net/p/openvpn/mailman/">OpenVPN</a> und <a href="https://mta.openssl.org/mailman/listinfo/openssl-announce">OpenSSL</a>.


## Das war's ...

Ich hoffe, Dein Server läuft soweit gut und die Verschlüsselung funktioniert. Zum Abschluss noch 3 Dinge:

1. Das VPN verteilt IPv6-ULA Adressen mit route 2001::/3, damit IPv6 nicht mehr über Freifunk unverschlüsselt übertragen wird.  Damit IPv6 extern funktioniert, brauchst Du einen *Public IPv6 Block*, den Du statt dem ULA-Netz verteilst. Tunnel gibt's z.B. bei <a href="https://he.net">he.net</a>.
2. Das VPN schützt nur vor Angreifern im Freifunk-Netz – im Internet bist Du ungeschützt. Hier hilft nur Ende-Zu-Ende Verschlüsselung. Hilfe gibt's auf einer <a href="https://cryptoparty.koeln">Cryptoparty</a>.
3. Dein eigener VPN-Server entlastet das Freifunk-Netz, da Dein Internet-Traffic nicht über die wenigen Gateways geleitet werden muss.
Es reicht eine Funk- oder fastd-Verbindung zwischen den beteiligten Nodes.
