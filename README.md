# FF Tracker

Suivi de progression Final Fantasy XIV pour un personnage : pages par catégorie avec cases à cocher et synchro automatique depuis le Lodestone.

| Section | Pages | Automatique ? |
|---|---|---|
| Routine | Hebdo & quotidien (se décoche au reset : 15:00 UTC / mardi 08:00 UTC) | — |
| Personnage | Classes, Tribus (rang max), Histoire principale, Quêtes de rôle, Rangs | Classes : Lodestone. Tribus / histoire / rôle : via les succès |
| Combat | Reliques & armes ultimes (1 case par arme finale et par job), Contenus | Via les succès quand un succès existe |
| Collections | Montures, mascottes, titres, Triple Triade (cartes + PNJ), Mage bleu, orchestrions, emotes, coiffures, accessoires, bardes, cadres, archives (variables, Bozja, Croissant) | Montures/mascottes : Lodestone. Titres : via les succès. Le reste : à la main |
| Autres | Tous les succès, Listes perso | Succès : Lodestone |

## Lancer

```bash
npm install
npm run dev      # http://localhost:3001 (API + front avec rechargement à chaud)
```

En production : `npm run build` puis `npm start` (même adresse).

## Synchro automatique

Le serveur Node (`server/`) lit le Lodestone FR (le navigateur ne peut pas l'appeler directement à cause du CORS) :

- niveaux : page `class_job` ;
- montures/mascottes possédées : version mobile des pages `mount` / `minion`, rapprochées par nom de la base FFXIV Collect ;
- succès : toutes les pages `achievement` (3 requêtes en parallèle max pour ne pas se faire couper par le Lodestone). **Les succès doivent être publics** dans les paramètres du Lodestone.

Les listes complètes (montures, succès, reliques…) viennent de [FFXIV Collect](https://ffxivcollect.com), en français, et sont préchargées au démarrage du serveur.

La synchro écrase les niveaux et les succès mais ne fait qu'**ajouter** des montures/mascottes : elle ne décoche jamais ce que tu as coché à la main. Un élément coché grâce à un succès porte le badge « auto ».

Les données sont stockées dans le `localStorage` du navigateur : pense à exporter régulièrement (Accueil → Sauvegarde).

## Tests

```bash
npm test         # parseurs Lodestone, jobs, resets, migration, tribus, reliques
npm run typecheck
```
