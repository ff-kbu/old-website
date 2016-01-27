---
layout: default
title: "Supernodes sind Nodes"
author: "Frank Nord"
date: 2016-02-02 00:00:00
---
# Nicht als Server gedacht - Teil 2
Irgendwas lief schief und das Netz der KBU fiel praktisch aus. Was ist geschehen?

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
Vor etwa zwei Jahren - Anfang 2014 - war das Netz wieder einmal überlastet. Rampone bemerkte, dass die komplette WLAN-Kapazität durch broadcast und anycast Traffic belegt wurde. Die Anzahl der Knoten hat sich seitdem mehrmals verdoppelt. Die Last auf den Servern - die einzigen wenigen Supernodes - schoss nach oben. Kommunikation war nicht mehr möglich. Im Dezember 2015 / Januar 2016 war das Netz praktisch unbenutzbar.

Anstatt die Situation zu untersuchen und die Ideen der Anfangszeit zu hinterfragen, neue Techniken und Netzwerk-Topologien zu erforschen wurde das Netz fett. Durch den Fokus auf Wachstum wurde es überlastet. Verschiedene Techniken (fastd, mcast-Rate, ebtables, no-rebroadcast) konnten die Last kurzzeitig reduzieren, halfen aber auf längere Sicht nicht.

Stattdessen versuchte die KBU *Internet-Zugänge* in Bäckereien, Organisation oder selbst in der komplette Bonner Stadtverwaltung zu vermarkten. Dies verschlechterte die Situation weiter: *Schnelle* und *zuverlässige* Internet-Zugänge wurden erwartet. Eine *de-facto* Anbieter-Verbraucher-Beziehung wurde geschaffen. Nur wenige hatten ein Interesse daran, sich in die Community einzubringen, Dinge zu hinterfragen und weiter zu entwickeln.


## Die Entwicklung bei Freifunk-KBU
Das Netz war nie wirklich dazu gedachten, schnellen Internetzugang in einem großen Rahmen anzubieten. Anders als Hotspot-Netze ist Freifunk-KBU nicht einfach ein Interner-Provider.

Freifunk-KBU entstand im C4 als *Erfa-Projekt* mit CCC-Projektmitteln. Der Chaos Computer Club ist in Erfa-, d.h. *Erfahrungsaustausch-Kreisen* organisiert. Ein solcher Kreis ist der Chaos Computer Club Cologne (C4) e.V. . Vereinszweck des C4 sind unter anderem Forschung, Wissenschaft und Bildung.  

Freifunk ist eine lose und dezentrale Initiative. Sie besteht aus Menschen, die sich zu Freifunk bekennen und freie Funknetze bauen. Freifunk und Erfa-Kreis passen gut zusammen: Freifunk heißt, Netze zu bauen, an dem jede / jeder aktiv teilnehmen kann - ohne Gremium, Admins oder zentrale Autoritäten. Der Erfa-Anspruch ist hier freie Netze zu erforschen und Wissen darüber zu vermitteln.

Viele Design-Entscheidungen bei KBU kommen daher:

- Die komplette Dokumentation ist offen. Sie kann von anderen Freifunk-Netzen verwendet werden. Auch in Köln oder Bonn.
- Mit Tinc, wird ein dezentrales P2P-VPN verwendet um Supernodes zu verbinden.
- Die Ressourcenvergabe (Namen, IP-Adressen) wird in Wikis koordiniert. Es gibt keine zentrale Autorität.

Dennoch hängt der komplette Freifunk-Betrieb im Köln-Bonner-Raum an ca. 3-4 Supernode-Admistratoren und einer Hand voll zentralen Supernodes. Sie laufen auf virtuellen Servern in Rechenzentren und werden wegen Überlastung abgeschaltet oder gedrosselt (https://lists.kbu.freifunk.net/pipermail/freifunk-bonn/2016-January/005730.html). Freifunk-Firmware wird für die Nutzung im Netz released, d.h. *freigegeben*.

Wissen wird kaum vermittelt - Forschung findet nicht statt. Im Fokus ist der kostenlose Zugang zum Internet. Das hat nur noch wenig mit Erfa-Arbeit zu tun.  Der Stand bei Freifunk-KBU ist das Ergebnis einer Entwicklung und er wird aktuell nicht wirklich in Frage gestellt. 

## Freifunk Richtig und Wahr

Es ist kompliziert. Niemand sagt, dass dieser Freifunk „falscher Freifunk” ist oder jenes Netz stinkt. Konsenz bei Freifunk ist das *Pico Peering Agreement*. Es wird im KBU-Netz umgesetzt. Wie bei allen anderen Freifunk-Communities.

Bei KBU engagieren sich viele Menschen dafür, freies Internet in öffentlichen Gebäuden oder Flüchtlingsunterkünften zu bauen. Das Engagement dafür ist gut - macht weiter. Ich finde es aber beispielsweise besser, ein Netz *mit*,  als ein Netz *für* Flüchtlinge zu bauen. Dieser Anspruch fehlt in der Freifunk-KBU Community.

Dennoch muss sich die Freifunk-KBU Community entscheiden, welchen technischen Konsequenzen aus der Ausrichtung entstehen. Viele Entscheidungen (fester Funkkanal zum Meshing, Roaming über weite Gebiete) beeinträchtigen die WLAN- und Internet-Geschwindigkeit stark. Die Überlastung der KBU-Supernodes wäre auch so evtl. vermeidbar. 

Auch ist das Wachstum in der KBU-Community sehr beschränkt: Nur wenige werden Super-Nodes betreiben können, wenn die Hürde hoch ist, Dokumentation fehlt und Wissen nicht aktiv und progressiv vermittelt wird.

### Unvereinbare Positionen?

Die Positionen sind nicht unvereinbar. Niemand in der Freifunk-KBU Community meint, dass Erfa-Arbeit schlecht ist. Niemand im C4 meint, dass es eine schlechte Idee ist, Flüchtlingsunterkünfte mit kostenlosem WLAN auszustatten. Beide Positionen ergänzen sich.

## Fragen an die Community

Die Freifunk-KBU Community muss sich dennoch überlegen:

1. Ist das Netz noch Freifunk, wenn es von 3-4 Admins zentral gesteuert wird?
2. Wie soll das Projekt bestehen, wenn die Last auf den Servern nicht handhabbar ist?
3. Was ist wirklich das Ziel des Projekts?

Kurz und knapp - meine Antworten:

1. Es ist sehr schlecht, dass das Netz von 3-4 Admins zentral gesteuert wird.
2. Die Last auf dem Servern nimmt ab, wenn keine Server benötigt werden.
3. Bauen wir gemeinsam ein freies Netz, dass von niemandem einfach abgeschaltet werden kann. (<a href="https://vimeo.com/64814620">Lisa in "Freifunk verbindet!"</a>)

Wenn Du zustimmst, dann:

- Bau Deinen Supernode. Bau Dein eigenes Freifunk-Netz im Freifunk-Netz (Teil 1).
- Erzähl Leuten davon und verbreite das Wissen. Schreib' Wiki-Seiten oder Blogs.
- Forsche und fordere die Technik heraus: Entwickle Deinen Supernode weiter.

## Fazit 

Du musst Dich entscheiden, wie Du Freifunk machst baust und was Dir dabei wichtig ist. 

Ich hab' Dir erzählt, wie die Dinge funktionieren und hoffe, Du hast Blut geleckt. Ideen zur Weiterentwicklung, zum Testen und Forschen gibt's dann in Teil 3 dieser Blog-Serie.