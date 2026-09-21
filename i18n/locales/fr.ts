export default {
  navigation: {
    home: 'Accueil',
    about: 'A propos',
    experience: 'Expériences',
    skills: 'Compétences',
    education: 'Education',
    projects: 'Projets',
    contact: 'Contact',
    resume: 'CV',
  },
  home: {
    greetings: 'Hello! Je m\'appelle',
    position: 'Développeur Fullstack',
    button: 'En savoir plus',
  },
  about: {
    description: 'Curieux - Esprit d\'équipe',
    pickupline: 'J\'aime les challenges',
    musics: 'Mon top spotify',
    games: 'Mes jeux',
    hobbies: {
      title: 'Mes hobbies',
      music: 'Musique',
      australia: 'Australie',
    },
  },
  experience: [
    {
      date: '2021 - Aujourd\'hui',
      title: 'ACII by Audensiel',
      content: 'Développeur Fullstack Java Vuejs',
      details: [
        {
          date: '2021 - Aujourd\'hui',
          title: 'Mutuelle de Poitiers Assurances',
          content: 'Développement d\'application web',
          skills: [
            {
              details: 'Nous utilisons Vuejs 2 avec VueX et des librairies externes comme Vue Property Decorator, Vue Class Component et Vuex Property Decorator',
            },
            {
              details: 'Nous utilisons Java EE 8 Pour le backend avec Spring Boot et Hibernate',
            },
            {
              details: 'Nous utilisons Spring Boot 2 et Spring Security pour construire les APIs',
            },
            {
              details: 'Le projet a été organisé en sprints de 3 semaines avec une réunion hebdomadaire et des revues de code',
            },
          ],
        },
        {
          date: '2021',
          title: 'Tempo',
          content: 'Développement d\'application web',
          skills: [
            {
              details: 'Nous avons utilisé Angular 11 en frontend. Le but était de monter en compétences sur une version plus récente.',
            },
            {
              details: 'Nous avons utilisé Java 15 avec Spring Boot et Hibernate.',
            },
            {
              details: 'Nous avons utilisé Spring Boot, MVC and Security pour construire l\'API.',
            },
            {
              details: 'Etant un projet réservé aux inter-mission, il y avait un grand turn-over. Nous avons donc du documenter le plus possible le projet et écrire des tests fonctionnels et end to end pour s\'assurer de la continuité et faciliter la prise en main du projet. Nous avions des daily, des revues de code et des merge requests sur des sprints d\'une semaine.',
            },
          ],
        },
      ],
    },
    {
      date: '2020',
      title: 'Sopra Steria',
      content: 'Stage de développeur Java Angular',
      details: [
        {
          content: 'Migration Angular 2 et développement d\'évolutions et correctifs sur des applications de gestions des professionnels de santé et des dossiers médicaux',
          skills: [
            {
              details: 'Nous avons travaillé sur la migration d\'une application de Flex vers Angular 2',
            },
            {
              details: 'Nous avons gardé le backend existant en Java 8',
            },
            {
              details: 'Le projet a été réorganisé en agile avec des daily, des revues de code et des sprints de 3 semaines',
            },
          ],
        },
      ],
    },
    {
      date: '2019',
      title: 'Sopra Steria',
      content: 'Stage de développeur Java Flex',
      details: [
        {
          content: 'Développement d\'évolutions et correctifs sur des applications de gestions des professionnels de santé et des dossiers médicaux',
          skills: [
            {
              details: 'Les applications étaient développées en Flex pour le frontend',
            },
            {
              details: 'Le backend était développé en Java 8',
            },
          ],
        },
      ],
    },
  ],
  skills: {
    experience: 'Expérience',
    exp: 'Aucune | {n} an | {n} ans',
    level: 'Niveau {n} sur 5',
  },
  education: [
    {
      date: '2023',
      title: 'Vuejs',
      content: 'Formation de 3 jours pour enrichir et consolider mes connaissance sur Vue 2 et commencer à apprendre les nouveautés apportées par Vue 3',
    },
    {
      date: '2017 - 2020',
      title: 'Polytech Tours',
      content: 'Diplôme d\'ingénieur informatique',
    },
    {
      date: '2015 - 2017',
      title: 'IUT Angoulême',
      content: 'DUT Génie Electronique et Informatique Industrielle',
    },
  ],
  projects: [
    {
      alt: 'Mutuelle de Poitiers Assurances',
      title: 'Prévoyance',
      description: 'Ma mission à la mutuelle de Poitiers Assurance est de développer une application pour leur nouveau produit de Prévoyance.',
    },
    {
      alt: 'Portfolio',
      title: 'Portfolio',
      description: 'Migration de mon ancien portfolio static (html, css) vers Vue/ExpressJs',
    },
    {
      alt: 'Solveur de TSP',
      title: 'Application web de solveur de TSP',
      description: 'Site web de solveur de TSP créé durant ma dernière année à Polytech Tours en projet libre. Son but est de faire découvrir de manière intéractive le problème du TSP et les méthodes pour le résoudre.',
    },
    {
      alt: 'Hololens RGBD Stream to point cloud',
      title: 'Hololens RGBD Stream en nuage de points',
      description: 'Projet de fin d\'étude à Polytech. Recherche et développement d\'une application pour les Hololens visant à récupérer les données des capteurs de profondeur et d\'images et à recréer un nuage de points en 3D en réalité augmentée.',
    },
  ],
  other: [
    {
      alt: 'Virtual moneybox',
      title: 'Tirelire virtuelle',
      description: 'Application web crée lors d\'un projet de groupe de 4ème année à Polytech Tours avec 6 élèves. Le projet a été commandé par une équipe de Sopra Baking Software',
    },
    {
      alt: 'SwalloWin Sound',
      title: 'SwalloWin Sound',
      description: 'Projet étudiant en groupe de 5 à Polytech Tours. Revfonte d\'une application android visant à aider les médecin à détecter des pathologies en enregistrant les bruits de déglutitions.',
    },
    {
      alt: 'Première version de mon site web',
      title: 'Mon premier site web',
      description: 'Mon site web personnel développé en html/css/js sur mon temps libre à Polytech Tours afin d\'apprendre les bases du développement web et de mettre en avant mes compétences.',
    },
    {
      alt: 'AJL Peinture',
      title: 'AJL Peinture',
      description: 'Un site web créé pour un artisan en 2020. Il a été développé avec React et firebase ce qui m\'a permis d\'apprendre à utiliser ce framework et monter en compétences dessus.',
    },
  ],
  projectsSection: {
    otherToggle: 'Autres projets',
    otherToggleClose: 'Masquer les autres projets',
    filterAll: 'Tout',
    filterLabel: 'Filtrer par technologie',
    viewRepo: 'Voir le dépôt de {name}',
    viewLive: 'Voir {name} en ligne',
  },
  contact: {
    title: 'Contactez moi',
    mail_title: 'Envoyez moi un e-mail',
    name: 'Votre nom',
    email: 'Votre e-mail',
    message: 'Votre message',
    send: 'Envoyer',
    sending: 'Envoi en cours…',
    copy_phone: {
      ko: 'Erreur: Impossible de copier le numéro. Vous pouvez le noter : 0646898223',
      ok: 'Copié 😇 !',
    },
    mail_response: {
      ko: 'Une erreur s\'est produite 😞 Vous pouvez toujours me contacter directement par mail : contact@nathancouton.fr',
      ok: 'Votre message a bien été envoyé 😃 Je vous répondrai dès que possible!',
    },
    errors: {
      nameRequired: 'Votre nom est requis',
      nameTooShort: 'Au moins 2 caractères',
      emailRequired: 'Votre e-mail est requis',
      emailInvalid: 'Cet e-mail ne semble pas valide',
      messageRequired: 'Votre message est requis',
      messageTooShort: 'Au moins 10 caractères',
      messageTooLong: '2000 caractères maximum',
    },
    music: {
      play: 'Lancer le thème de Hollow Knight',
      pause: 'Mettre la musique en pause',
      playing: 'Musique en cours de lecture',
      volume: 'Volume',
    },
    credits: 'Décor inspiré de Hollow Knight (Team Cherry) — usage personnel, non commercial.',
  },
  rail: {
    hint: 'défilez',
    progress: 'Progression dans la page',
    goTo: 'Aller à la section {name}',
  },
  intro: {
    skip: 'Passer l\'introduction',
  },
  a11y: {
    skipToContent: 'Aller au contenu',
    mainNav: 'Navigation principale',
    toggleTheme: 'Basculer entre le thème clair et sombre',
    themeDark: 'Thème sombre',
    themeLight: 'Thème clair',
    selectLanguage: 'Choisir la langue',
    downloadResume: 'Télécharger mon CV au format PDF',
    openExternal: '{name} (nouvel onglet)',
    closeModal: 'Fermer',
    expandDetails: 'Afficher le détail de {name}',
    collapseDetails: 'Masquer le détail de {name}',
    sceneOf: 'Section {current} sur {total}',
  },
  footer: {
    backToTop: 'Retour au début',
    builtWith: 'Fait avec Nuxt',
  },
} as const
