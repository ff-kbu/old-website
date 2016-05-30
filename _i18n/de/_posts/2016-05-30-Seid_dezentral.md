---
layout: default
title: "Seid Dezentral"
author: "Frank Nord"
date: 2016-05-30 21:00:00
---
## Dezentrales Mesh-Netzwerk

Freifunk versteht sich als *dezentrales Mesh-Netzwerk*. Dezentralität ist ein Ziel vieler Freifunk-Communities - aber auch ein sehr schwieriges.

Doch was ist Dezentralität? Woher kommt die Forderung und wie setzt Freifunk sie um? Ich versuche mal eine Erklärung.

<!--break-->
## Hackerethik

Im Buch <a href="http://www.stevenlevy.com/index.php/books/hackers">Hackers – Heroes of the Computer Revolution</a> beschreibt Steven Levy 1984 die frühe Hacker-Kultur (~1960) am MIT um den Großrechner TX-0. Levy beschreibt eine Hacker-Ethik, die 6 Leitsätze umfasst – einer davon fordert Dezentralität:

> SOMETHING new was coalescing around the TX-0: a new way of life, with a  philosophy, an ethic, and a dream. 
>
>[...]
> The precepts of this revolutionary Hacker Ethic were not so much debated and 
> discussed as silently agreed upon. No manifestos were issued. No missionaries 
> tried to gather converts. The computer did the converting, and those who seemed 
> to follow the Hacker Ethic most faithfully were people like Samson, Saunders, and 
> Kotok, whose lives before MIT seemed to be mere preludes to that moment when 
> they fulfilled themselves behind the console of the TX-0. [...] 
> Still, even in the days of the TX-0, the planks of the platform were in place. The 
> Hacker Ethic [...]:
>
> **Mistrust Authority Promote Decentralization.**
> 
> The best way to promote this free exchange of information is to have an open 
> system, something which presents no boundaries between a hacker and a piece of 
> information or an item of equipment that he needs in his quest for knowledge, 
> improvement, and time on-line. The last thing you need is a bureaucracy. 
> Bureaucracies, whether corporate, government, or university, are flawed systems, 
> dangerous in that they cannot accommodate the exploratory impulse of true 
> hackers. Bureaucrats hide behind arbitrary rules (as opposed to the logical 
> algorithms by which machines and computer programs operate): they invoke those 
> rules to consolidate power, and perceive the constructive impulse of hackers as a 
> threat. 

Die Forderung nach Dezentralität wurde auch seitens des CCC in die Hackerethik <a href="https://www.ccc.de/de/hackerethik">aufgenommen</a>. Hierzu <a href="https://de.wikipedia.org/wiki/Hackerethik">wikipedia</a>:

> **Misstrauen gegenüber Autorität und Bevorzugung von Dezentralisierung.**
> 
> Das Erstellen von einem offenen System ohne Grenzen ist die beste Möglichkeit, um es Hackern zu ermöglichen an notwendige Informationen oder 
> Ausrüstung zu gelangen, welches diese benötigen um ihrer Pflicht des Sammeln von Wissen und des Verbesserns von sich selbst und der Welt benötigen.
> Hacker glauben daran, dass ein bürokratisches System ein fehlerbehaftetes System ist, egal wo dieses System angewendet wird.

Beide Varianten stellen Autorität und Dezentralisierung gegenüber. Keine zentrale Autorität oder Bürokratie soll den Zugang verhindern können. Dezentralität ist eine Möglichkeit, den freien Informationsaustausch zentraler Kontrolle zu entziehen. Zwei Dinge sind wichtig:

1. Dezentralität ist *kein Selbstzweck*. Sie stellt den Zugang zu Wissen und Systemen sicher. Sie ist eine Grundlage in der Hackerkultur.
2. Die Forderung nach Dezentralität ist *sozial* und *nicht technisch*. Es geht um *„Wer herrscht über was?”* und nicht um technische Redundanz.

## Und Freifunk?

Vom Selbstverständnis her ist Freifunk ein Mitmach-Netz, zudem jede und jeder freien Zugang hat. Freifunk ist in der Hackerkultur verwurzelt. 
Es entscheidet keine Autorität darüber was Freifunk ist. Niemand entscheidet darüber, wer mitmachen und sich Freifunkerin (bzw. Freifunker) nennen darf. Informationen über Freifunk-Netze sind offen. Alle können Freifunk-Communities gründen, hacken und ihr Netz bauen. Jedoch fühlen sich nicht alle Freifunkerinnen und Freifunker als Hacker. 

Es ist nicht zwingend notwendig, Freifunk-Netze zusätzlich redundant (d.h. technisch dezentral) zu gestalten. Beispielsweise sagt niemand, an wie vielen Orten Nodes oder Server stehen müssen. Viele unabhängige Freifunk-Communities mit eigenen, aber verbundenen Netzen bilden ein großes, dezentrales Freifunk-Netz. Das *Pico-Peering-Agreement* (<a href="http://www.picopeer.net/">PPA</a>) stellt nur sicher, wie die Komponenten offen für den Datenaustausch mit anderen sein müssen.
Technische Dezentralität kann sogar hinderlich sein: Je ausgeklügelter und komplexer das Setup, desto steiler ist die Lernkurve. Desto schwieriger wird es mitzumachen, sich zu orientieren und darauf aufbauend ein eigenes Netz zu bauen.

In der Anfangszeit bestand das KBU-Netz aus einem VPN-Server (Paul) und etwa 10-15 Nodes. Technisch gesehen war das Netz zentralistisch: Fiel Paul aus, so war das Netz praktisch tot. 
Aber die Community war dezentral organisiert: Sie existierte unabhängig von anderen Communities, veröffentlichte Sourcecode, Konzepte und Dokumentationen. Keine priviligierten Administratoren herrschten über den Server: Fast alle, die mitmachten hatten root-Zugang auf Paul per SSH.

Zudem stellt Freifunk die Forderung nach freiem Zugang zu Informationen. Jede und jeder sollen im Freifunk-Netz Informationen frei austauschen können. Die Hackerethik enthält also noch andere Punkte, die für die Freifunk-Kultur wichtig sind. Ich bleib aber mal bei der Dezentralität.

## Anforderungen

Machen wir es formal – Anforderungen an dezentrale Freifunk-Communities:

1. **Dokumentiert Eure Setups** – Ermöglicht anderen das gleiche Netz zu bauen.
2. **Denkt nicht territorial** – Ihr seid nicht die zentrale Freifunk-Autorität in Eurer Stadt oder Eurem Kreis. Eine andere Community ist wichtiger als Eure eigene.
3. **Schafft keine Autoritäten** – Herrscht nicht als Administratoren über das Freifunk-Netz.
4. **Hackt** – Nutzt die Dezentralität: Tut Dinge, erkundet und schafft Wissen. Habt Spaß am Gerät.

Und: <br />
Lebt Widersprüche in bester diskordianischer Tradition: Natürlich ist das <a href="https://wiki.freifunk.net/Freifunk_Advisory_Council">Freifunk Advisory Council</a> eine Autorität. Natürlich schließt ein offenes Mitmach-Netz alle Menschen aus, die Rechnernetze nicht verstehen können. 
Aber diese Widersprüche sind kein Grund die Ideale der Hackerkultur aufzugeben. <br /> 
Kommt damit klar.
