# GIO Business Planner PRO – Mobile TEST 004

Basis: Mobile TEST 002 Stabiel (layout en instellingen behouden).

Toegevoegd:
- KM / Reis duidelijk bereikbaar via Meer en de snelle + knop.
- Werkboek: titel, type, klant, project/opdracht, zoeken, bewerken, afronden en verwijderen.
- Voorraad: foto, productnaam, categorie, locatie, eenheid, voorraad, minimum, inkoop/verkoop, bewerken en mutaties.
- Medewerkers / Inhuur: profiel, foto, contact, type, uur- en reistarief.
- Meegewerkte uren registreren per project en datum.
- Inhuurkosten worden automatisch als uitgave geregistreerd en kunnen als betaald worden gemarkeerd.
- Projectkaart toont gekoppelde Werkboek-notities en inhuurkosten.

Niet gewijzigd:
- Desktoplayout.
- Bestaande cloud-, synchronisatie- en back-upfuncties.
- Bestaande klanten, projecten, uren, materialen, facturen en offertes.

Controle:
- Nieuwe en bestaande mobiele JavaScript-bestanden slagen voor `node --check`.
- Een volledige Next.js-build kon in deze omgeving niet worden uitgevoerd doordat de interne npm-registry `next@latest` niet beschikbaar stelde (404).
- Gebruik eerst in een apart Vercel TEST-project.
