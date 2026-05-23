# Profils de test — Coach Carrière IA

5 profils couvrant des cas réels et variés à Madagascar.  
Chaque profil inclut le script de conversation simulée à copier-coller dans le chat.

---

## Profil 1 — Étudiant en informatique, ambitieux, veut le remote

**Persona :** Tojo, 22 ans, Antananarivo  
**Situation :** En L3 informatique à l'EMIT, code en Python et JavaScript depuis 1 an  
**Ambition :** Travailler en remote pour des clients européens  
**Blocages :** Manque de confiance ("je ne suis pas encore assez bon"), peur du rejet  
**Langue parlée :** Français + anglais B2  

### Script de test

| Tour | Message à envoyer |
|------|------------------|
| 1 | `Je m'appelle Tojo` |
| 2 | `Je suis en L3 informatique à l'EMIT à Antananarivo` |
| 3 | `Je sais coder en Python et JavaScript, j'ai fait quelques petits projets mais je ne suis pas encore assez bon je pense` |
| 4 | `Je veux travailler en remote pour des clients en France ou en Europe, gagner en euros` |
| 5 | `J'ai peur qu'on me rejette parce que je n'ai pas encore d'expérience professionnelle réelle` |
| 6 | `J'ai une bonne connexion Telma chez moi à Tana, et je parle anglais aussi, niveau B2 à peu près` |

### Résultats attendus

- **Profil détecté :** `careerContext: remote`, `location: Antananarivo`, skills: programming, french, english
- **Blocages détectés :** `manque_confiance`, `peur_échec`
- **Carrières suggérées :** Développeur Web/Mobile (1er), Freelance Digital Remote (2e)
- **Plan :** Les étapes doivent mentionner "commence petit pour te prouver", Malt + Upwork, portfolio GitHub
- **Onglet CV :** Mention "disponible remote, UTC+3"
- **Onglet Entretiens :** Rappel empathique "l'entretien est une conversation, pas un examen"

---

## Profil 2 — Reconversion professionnelle, enseignante qui veut changer

**Persona :** Miora, 31 ans, Fianarantsoa  
**Situation :** Enseignante de mathématiques depuis 5 ans, veut se reconvertir dans la data  
**Ambition :** Trouver un poste local bien rémunéré, si possible dans une ONG  
**Blocages :** Confusion d'orientation ("je ne sais pas si c'est réaliste à mon âge"), contrainte familiale  
**Langue parlée :** Français excellent, anglais A2  

### Script de test

| Tour | Message à envoyer |
|------|------------------|
| 1 | `Je m'appelle Miora` |
| 2 | `Je suis enseignante de maths à Fianarantsoa depuis 5 ans, je veux changer de carrière` |
| 3 | `Je suis très bonne en maths et statistiques, j'utilise Excel pour mes notes et analyses` |
| 4 | `Je ne sais pas si c'est réaliste de me reconvertir à 31 ans dans quelque chose de nouveau` |
| 5 | `Mon rêve ce serait de travailler dans une ONG, faire quelque chose qui a du sens` |
| 6 | `J'ai internet à la maison mais la connexion n'est pas toujours stable à Fiana. Je parle très bien français mais mon anglais est basique` |

### Résultats attendus

- **Profil détecté :** `careerContext: ngo`, `location: Fianarantsoa`, `currentSituation: en_reconversion`, skills: excel, teaching, strengths: organisation, résolution
- **Blocages détectés :** `confusion_orientation`, `peur_échec`
- **Carrières suggérées :** Data Analyst/Scientist (1er — maths + Excel), Chargé de projet ONG (2e), Formateur contenu éducatif (3e)
- **Plan :** KoboToolbox, Kaggle Learn, PMD Pro gratuit, renforcement anglais en priorité (frein ONG majeur)
- **Onglet LinkedIn :** Suivi des pages UNICEF Madagascar, GIZ, AFD
- **Coaching confiance :** Mention que la reconversion à 31 ans avec un background maths est un vrai atout dans les ONG

---

## Profil 3 — Autodidacte créatif, zéro diplôme, veut vivre de sa passion

**Persona :** Haingo, 25 ans, Antananarivo  
**Situation :** Sans diplôme supérieur, autodidacte sur YouTube, maîtrise Canva et Photoshop  
**Ambition :** Créer du contenu et faire du design pour des clients  
**Blocages :** Complexe du diplôme ("je n'ai pas fait de grande école"), perfectionnisme ("mes créations ne sont jamais assez bien")  
**Langue parlée :** Français, malgasy, anglais A2  

### Script de test

| Tour | Message à envoyer |
|------|------------------|
| 1 | `Je m'appelle Haingo` |
| 2 | `Je n'ai pas fait de grande école, juste le bac. J'ai tout appris seul sur YouTube` |
| 3 | `Je sais utiliser Canva, Photoshop et un peu Illustrator. J'adore le design et créer des visuels` |
| 4 | `J'attends toujours que mes créations soient parfaites avant de les montrer, du coup je n'ai pas encore de vrai portfolio` |
| 5 | `Je veux vivre de ma passion et travailler pour des entreprises à Madagascar ou même en remote` |
| 6 | `J'ai peur qu'on ne me prenne pas au sérieux parce que je n'ai pas de diplôme en design` |

### Résultats attendus

- **Profil détecté :** `careerContext: local` (puis remote), skills: design, strengths: créativité, autonomie
- **Blocages détectés :** `manque_diplôme`, `perfectionnisme`, `peur_jugement`
- **Carrières suggérées :** Designer UX/UI & Graphique (1er), Freelance Digital Remote (2e), Formateur contenu éducatif (3e)
- **Plan :** Étape portfolio doit mentionner explicitement "fait vaut mieux que parfait", Behance comme premier pas
- **Coaching blocage diplôme :** Mention que dans le design, le portfolio prime sur le parchemin à 100%
- **Onglet CV :** Insistance sur le lien Behance/portfolio comme élément central

---

## Profil 4 — BPO agent qui veut évoluer vers le management

**Persona :** Rova, 28 ans, Antananarivo  
**Situation :** Agent call center chez Intelcia depuis 3 ans, excellent français, veut devenir Team Leader puis manager  
**Ambition :** Évoluer en interne ou changer d'entreprise pour un poste de management  
**Blocages :** Réseau faible ("je ne connais personne dans le management"), manque de confiance pour se positionner  
**Langue parlée :** Français C1, malgasy natif, anglais B1  

### Script de test

| Tour | Message à envoyer |
|------|------------------|
| 1 | `Je m'appelle Rova` |
| 2 | `Je travaille comme agent dans un call center à Tana depuis 3 ans, je gère des clients français` |
| 3 | `Je suis très bon en communication et gestion des conflits clients, j'utilise Salesforce tous les jours` |
| 4 | `Je veux évoluer vers Team Leader ou manager mais je ne connais personne dans les postes au-dessus` |
| 5 | `J'ai peur de ne pas être légitime pour postuler à des postes de management sans avoir fait des études de gestion` |
| 6 | `Je suis à Tana, j'ai internet, je parle très bien français et assez bien anglais` |

### Résultats attendus

- **Profil détecté :** `careerContext: local`, `currentSituation: en_emploi`, skills: communication, sales, leadership, french, english
- **Blocages détectés :** `manque_réseau`, `manque_confiance`, `manque_diplôme`
- **Carrières suggérées :** Responsable Marketing Digital (1er — transition naturelle), Chargé de projet ONG (2e — anglais + CRM), Technicien BPO évolué → Manager (3e)
- **Plan :** Salesforce Trailhead (certification crédible), LinkedIn pour se rendre visible, Coursera Leadership gratuit
- **Onglet LinkedIn :** Connexion avec RH Intelcia, Webhelp, Telma, rejoindre groupes management Madagascar
- **Onglet Entretiens :** Valoriser les 3 ans d'expérience client comme compétence managériale concrète

---

## Profil 5 — Jeune entrepreneur en herbe, idée floue, besoin de cadrage

**Persona :** Lanto, 24 ans, Toamasina  
**Situation :** Vient de terminer un BTS commerce, veut créer une startup mais son idée n'est pas encore définie  
**Ambition :** Lancer sa propre entreprise à Madagascar dans le numérique ou l'agritech  
**Blocages :** Confusion totale ("je ne sais pas par où commencer"), peur du risque financier, pas de réseau entrepreneur  
**Langue parlée :** Français B2, malgasy natif, anglais A1  

### Script de test

| Tour | Message à envoyer |
|------|------------------|
| 1 | `Je m'appelle Lanto` |
| 2 | `J'ai un BTS commerce, je viens de terminer mes études à Toamasina` |
| 3 | `Je suis bon en vente et négociation, j'ai géré un petit business de revente pendant mes études` |
| 4 | `Je ne sais vraiment pas par où commencer pour créer ma boite, j'ai des idées mais c'est flou` |
| 5 | `J'ai peur de tout perdre si ça ne marche pas, et je n'ai pas d'argent pour me lancer vraiment` |
| 6 | `Je suis à Toamasina, la connexion internet n'est pas très stable. Je parle bien français mais pas anglais` |

### Résultats attendus

- **Profil détecté :** `careerContext: entrepreneurship`, `location: Toamasina`, `currentSituation: étudiant`, skills: sales, business, communication
- **Blocages détectés :** `confusion_orientation`, `contrainte_financière`, `peur_échec`, `manque_réseau`
- **Carrières suggérées :** Entrepreneur/Startup (1er), Responsable Marketing Digital (2e — tremplin viable), Freelance Digital (3e — revenus sans gros capital)
- **Plan :** Lean Startup methodology, Habaka (mentorat gratuit), NextAfrica Hub, pas de gros investissement initial conseillé
- **Coaching :** Plan doit mentionner que démarrer petit à Toamasina est possible, ressources accessibles offline/mobile data
- **Onglet CV :** Mettre en avant le business de revente comme "première expérience entrepreneuriale"

---

## Grille d'évaluation des tests

Pour chaque profil, vérifier :

| Critère | ✅ Attendu |
|---|---|
| Langue | Réponses en français exclusivement |
| Questions | Une seule question à la fois, jamais plusieurs |
| Blocages | Adressés avec empathie quand détectés dans le discours |
| Forces cachées | Nommées explicitement ("tu sous-estimes peut-être…") |
| Carrières | Pertinentes pour Madagascar, pas juste globales |
| Ressources | Gratuites, accessibles en faible bande passante |
| Plan | Adapté au `careerContext` (remote / ONG / local / entrepreneur) |
| Onglets | CV + LinkedIn + Entretiens visibles et personnalisés |
| Salaires | En Ariary (local) ou USD/EUR (remote) selon le profil |
| Ton | Inspirant mais honnête, jamais condescendant |
