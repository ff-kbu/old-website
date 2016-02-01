---
layout: default
title: "Supernodes sind Nodes"
author: "Frank Nord"
date: 2016-02-02 00:00:00
---
# Nicht als Server gedacht - Teil 2
Im Dezember 2015 / Januar 2016 war das Netz zeitweise unbenutzbar. Was ist geschehen?

Diese Serie besteht aus 3 Teilen. Teil 1 ist ein Howto zu Supernodes und Nodes. Teil 2 geht auf Dezentralisierung und die Probleme des KBU Netzes im Dezember / Januar ein. Teil 3 gibt einen technische Ausblick. Dies ist Teil 2.

<!--break-->

## Zusammenfassung Teil 1

Freifunk-Netze bestehen aus *Nodes*. Nodes sind dabei alle möglichen Geräte, die in ein Freifunk-Netz eingebunden sind. Supernodes sind Router die VPN-Tunnel aufbauen können.

- *Nodes* sind kleinere Geräte mit begrenzten Ressourcen.
- *Supernodes* sind größere Geräte, die Traffic routen.

In Teil 1 hab' ich erzählt, wie Du eine OpenWRT-Box als Node und schließlich als Supernode konfigurieren kannst. Dabei habe ich OpenWRT-Boardmittel benutzt und jede Menge Einstellungen gesetzt. Am Ende existierte ein Supernode, der IPv4-Adressen per DHCP verteilt, das Internet über ein hide.me-VPN freigibt und über das KBU-Backbone-VPN routed. 

Supernodes auf OpenWRT-Basis existieren im Freifunk-KBU Netz aber praktisch nicht. Fast alle aktiven Supernodes werden auf Server-Hardware in Rechenzentren betrieben und sind über VPN-Strecken angebunden. 

Dieser Artikel geht auf die Situation im KBU-Netz, die Geschichte und Probleme ein.

## Es ging kaputt
Vor etwa zwei Jahren - Anfang 2014 - war das Netz wieder einmal überlastet. Rampone bemerkte, dass die komplette WLAN-Kapazität immer wieder durch broadcast und anycast Peaks belegt wurde. Die Anzahl der Knoten hat sich seitdem mehrmals verdoppelt. Die Last auf den wenigen Servern, die als Supernodes eingesetzt waren schoss nach oben. Im Dezember 2015 / Januar 2016 war das Netz u.a. deswegen zeitweise unbenutzbar.

Verschiedene Techniken (fastd, mcast-Rate, ebtables, no-rebroadcast) konnten die Last kurzzeitig reduzieren, helfen aber auf längere Sicht nicht.

## Die Entwicklung bei Freifunk-KBU
Das Netz war nie wirklich dazu gedacht, schnellen Internetzugang in einem großen Rahmen anzubieten. Anders als Hotspot-Netze ist Freifunk-KBU nicht einfach ein Internet-Provider.

Freifunk-KBU entstand im C4 als *Erfa-Projekt* mit CCC-Projektmitteln. Der Chaos Computer Club ist in Erfa-, d.h. *Erfahrungsaustausch*, Kreisen organisiert. Ein solcher Kreis ist der Chaos Computer Club Cologne (C4) e.V.. Vereinszweck des C4 sind unter anderem Forschung, Wissenschaft und Bildung.  

Freifunk ist eine lose und dezentrale Initiative. Sie besteht aus Menschen, die sich zu Freifunk bekennen und freie Funknetze bauen. Freifunk und Erfa-Kreis passen gut zusammen: Freifunk heißt, Netze zu bauen, an dem jede / jeder aktiv teilnehmen kann - ohne Gremium, Admins oder zentrale Autoritäten. Der Erfa-Anspruch ist hier freie Netze zu erforschen und Wissen darüber zu vermitteln.

Viele Design-Entscheidungen bei KBU kommen daher:

- Die komplette Dokumentation ist offen. Sie kann von anderen Freifunk-Netzen verwendet werden. Auch in Köln oder Bonn.
- Mit Tinc, wird ein dezentrales P2P-VPN verwendet um Supernodes zu verbinden.
- Die Ressourcenvergabe (Namen, IP-Adressen) wird in Wikis koordiniert. Es gibt keine zentrale Autorität.

Dennoch hängt der komplette Freifunk-Betrieb im Köln-Bonner-Raum an ca. 3-4 Admistratoren und einer Hand voll zentralen Supernodes. Sie laufen auf virtuellen Servern in Rechenzentren und können wegen Überlastung abgeschaltet oder gedrosselt werden (https://lists.kbu.freifunk.net/pipermail/freifunk-bonn/2016-January/005730.html). Freifunk-Firmware wird nur noch für die Nutzung im Netz released, d.h. freigegeben.

Das alles hat nur noch wenig mit Erfa-Arbeit zu tun. Der Stand bei Freifunk-KBU ist das Ergebnis einer Entwicklung und er wird aktuell nicht wirklich in Frage gestellt. 

## Gluon 

Vor kurzem wurde Gluon im Netz der KBU eingeführt. 

Technisch hat sich wenig geändert. Die KBU verwendet seit ihrem Bestehen einen Fork der Lübecker Freifunk-Firmware. Grundlage ist nach wie vor batman-adv auf fastd-Tunneln. Ein paar Neuerungen wurden übernommen: Shellscripts erweitern das OpenWRT Buildsystem. Ein alfred-Server existiert nun neben dem Register-Server, die collectd-Statistiken werden nicht mehr gepflegt und die Software liegt in neuren Versionen vor. Neben der Gluon-Firmware wird die Gluon Map eingesetzt. Register-Informationen und Batman-adv-VIS-Daten werden ausgeblendet. Die Änderungen beteffen also Details.

Das Verständnis hat sich aber geändert. Gluon bringt Features einfach mit, die für Freifunk interessant sind. Anders als bei früheren Releases interessieren sich aber nicht mehr viele für die Technik. Von vielen wird Gluon als Produkt verstanden, dass einfach eingesetzt wird. 

Kurzum: Die Gluon-Umstellung betrifft die Mentalität und nicht die Technik. Die Probleme bleiben bestehen.

## Freifunk Richtig und Wahr

Es ist kompliziert. Niemand sagt, dass dieser Freifunk „falscher Freifunk” ist oder jenes Netz stinkt. Konsenz bei Freifunk ist das *Pico Peering Agreement*. Es wird im KBU-Netz umgesetzt. Wie bei allen anderen Freifunk-Communities.

Bei KBU engagieren sich viele Menschen dafür, freies Internet in öffentlichen Gebäuden oder Flüchtlingsunterkünften zu bauen. Das Engagement dafür ist gut - macht weiter. Ich finde es aber beispielsweise besser, ein Netz *mit*,  als ein Netz *für* Flüchtlinge oder andere zu bauen. Diesen Anspruch vertreten nicht alle in der Freifunk-KBU Community.

Dennoch muss sich die Freifunk-KBU Community entscheiden, welche technischen Konsequenzen aus der Ausrichtung entstehen. Viele Entscheidungen (fester Funkkanal zum Meshing, Roaming über weite Gebiete) beeinträchtigen die WLAN- und Internet-Geschwindigkeit stark. Die Überlastung der KBU-Supernodes wäre auch so evtl. vermeidbar.  Auch wären eine bessere Organisation & Aufteilung der Arbeit sowie viele neue Freifunkerinnen und Freifunker, wichtig um die Arbeit zu bewältigen. 

Das Wachstum ist aber beschränkt: Nur wenige werden Super-Nodes betreiben, wenn die Hürde hoch ist, Dokumentation fehlt und Wissen nicht aktiv und progressiv vermittelt wird. Lernen, Verstehen und Ausprobieren gehört dazu.

### Unvereinbare Positionen?

Die Positionen sind nicht unvereinbar. Niemand in der Freifunk-KBU Community meint, dass Erfa-Arbeit schlecht ist. Niemand im C4 meint, dass es eine schlechte Idee ist, Flüchtlingsunterkünfte mit kostenlosem WLAN auszustatten. Beide Positionen ergänzen sich.

## Fragen an die Community

Die Freifunk-KBU Community muss sich überlegen:

1. Ist das Netz noch dezentral und Freifunk, wenn es von 3-4 Admins administriert wird?
2. Wie soll das Projekt bestehen, wenn die Last auf den Servern nicht handhabbar ist?
3. Was ist das Ziel des Projekts?

Kurz und knapp - meine Antworten:

1. Es ist sehr schlecht, dass das Netz von 3-4 Admins zentral gesteuert wird.
2. Es gibt keine Lastprobleme auf Servern, falls keine zentralen Server als Supernodes verwendet werden.
3. Bauen wir gemeinsam ein freies Netz, dass von niemandem einfach abgeschaltet werden kann. (<a href="https://vimeo.com/64814620">Lisa in "Freifunk verbindet!"</a>)

Wenn Du zustimmst, dann:

- Bau Deinen Supernode. Bau Dein eigenes Freifunk-Netz im Freifunk-Netz.
- Erzähl Leuten davon und verbreite das Wissen. Schreib' Wiki-Seiten oder Blogs.
- Forsche und fordere die Technik heraus: Entwickle Deinen Supernode weiter.

## Fazit 

Vor kurzem wurde das Netzwerk in drei Segmente eingeteilt. Es besteht aus den Hoods Köln, Bonn, Umgebung. Die Last auf den Supernodes wurde wieder geringer - 1/3 weniger Broadcast-Pakete werden versendet. So war es bereits bei Einführung des no-rebroadcast-Patches. Das Netz konnte für ein paar Monate stabilisiert werden. 

Die KBU-Supernodes betreiben nun drei Netze. Einrichtung und Setup wurden komplexer. Die Netze werden  von dem kleinen Admin-Team verwaltet. Gluon ist technisch komplexer als die Classic-Firmware und damit schwerer zu debuggen und zu verstehen. Kaum einer stellt das aktuelle Konzept aus Nodes, Supernodes und der <a href="https://kbu.freifunk.net/wiki/index.php?title=Netzwerk-Konfiguration#Komplettes_Bridging">"Komplettes-Bridging"-Strategie</a> in Frage. 

*Ich fange mal damit an*:

- *Nodes* sind Geräte, die Traffic routen.
- *Accesspoints* sind kleinere Geräte mit begrenzten Ressourcen. 

Kleine Geräte bauen kein Netz. Sie sind *Accesspoints*, d.h. Zugangspunkte zu den Supernodes. Supernodes sind die einzigen Nodes im Freifunk-Netz - ich nenne sie fortan einfach Nodes. Der in Teil 1 vorgestellte Supernode ist ein Node der genau das umsetzt.  Die alte Unterscheidung zwischen Nodes und Supernodes ist hinfällig.

Du musst Dich entscheiden, wie Du Freifunk machst, baust und was Dir dabei wichtig ist.  Ich hab' Dir erzählt, wie die Dinge funktionieren.
Ideen zur Weiterentwicklung, zum Testen und Forschen gibt's dann in Teil 3 dieser Blog-Serie.

Und nun mach Freifunk. Viel Spaß am Gerät.