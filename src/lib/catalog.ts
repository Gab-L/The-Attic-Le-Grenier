export const rarities = ["common", "uncommon", "rare", "legendary"] as const;
export type Rarity = (typeof rarities)[number];
export const rarityLabels: Record<Rarity, string> = {
  common: "Courant",
  uncommon: "Peu courant",
  rare: "Rare",
  legendary: "Légendaire",
};
export const collections = [
  {
    id: "recreation",
    name: "La cour de récré",
    description: "Le trésor au fond de ta poche.",
    reward: "Fanions de récré",
  },
  {
    id: "ecole",
    name: "Sur les bancs",
    description: "La rentrée sentait la gomme neuve.",
    reward: "Affiche des petits génies",
  },
  {
    id: "gaming",
    name: "Encore une partie",
    description: "Juste cinq petites minutes…",
    reward: "Étoiles phosphorescentes",
  },
  {
    id: "musique",
    name: "La bande-son",
    description: "Ces chansons qu’on connaît encore.",
    reward: "Vinyle au mur",
  },
  {
    id: "informatique",
    name: "Connexion en cours",
    description: "Un autre monde derrière l’écran.",
    reward: "Affiche connexion",
  },
  {
    id: "quotidien",
    name: "Petits grands trésors",
    description: "Les choses ordinaires qu’on n’a pas oubliées.",
    reward: "Guirlande lumineuse",
  },
];
export type Definition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  period: string;
  category: string;
  collection_id: string;
  rarity: Rarity;
  illustration: string;
  width: number;
  surfaces: string[];
  active: boolean;
};
const entries: [string, string, string, Rarity, string, string, number?][] = [
  [
    "bille",
    "Bille œil-de-chat",
    "1990",
    "common",
    "recreation",
    "Un minuscule tourbillon de couleurs, prêt pour le prochain duel.",
  ],
  [
    "yoyo",
    "Yoyo translucide",
    "2000",
    "common",
    "recreation",
    "Il descend toujours. Remonter demande un peu plus de pratique.",
  ],
  [
    "corde",
    "Corde à sauter",
    "1990",
    "common",
    "recreation",
    "Une poignée dans chaque main, et le sol devient de la lave.",
  ],
  [
    "toupie",
    "Toupie de poche",
    "2000",
    "uncommon",
    "recreation",
    "Un coup de poignet et la récré dure encore quelques secondes.",
  ],
  [
    "ressort",
    "Ressort arc-en-ciel",
    "2010",
    "uncommon",
    "recreation",
    "Pour lui, un escalier est une grande aventure.",
  ],
  [
    "billes",
    "Coffret de billes",
    "1990",
    "rare",
    "recreation",
    "Les plus belles ne sortaient de leur boîte que pour être admirées.",
    2,
  ],
  [
    "regle",
    "Règle à pochoirs",
    "1990",
    "common",
    "ecole",
    "Des étoiles parfaitement dessinées dans la marge du cahier.",
  ],
  [
    "trousse",
    "Trousse zippée",
    "2000",
    "common",
    "ecole",
    "Son petit bruit annonçait le début de la journée.",
  ],
  [
    "stylo",
    "Stylo multicolore",
    "2010",
    "common",
    "ecole",
    "Une couleur différente pour chaque grande idée.",
  ],
  [
    "gomme",
    "Gomme parfumée",
    "1990",
    "uncommon",
    "ecole",
    "Trop jolie pour vraiment effacer les erreurs.",
  ],
  [
    "carnet",
    "Carnet à cadenas",
    "2000",
    "uncommon",
    "ecole",
    "Les plus grandes histoires tenaient sur quelques pages.",
  ],
  [
    "globe",
    "Globe lumineux",
    "2010",
    "rare",
    "ecole",
    "Le monde entier, à portée de main sur le bureau.",
  ],
  [
    "manette",
    "Manette à câble",
    "1990",
    "common",
    "gaming",
    "Le câble emmêlé faisait partie du rituel.",
  ],
  [
    "cartouche",
    "Cartouche de jeu",
    "1990",
    "common",
    "gaming",
    "Une aventure entière dans une petite boîte bien solide.",
  ],
  [
    "de",
    "Dé translucide",
    "2000",
    "common",
    "gaming",
    "Une table, quelques amis et une nouvelle quête.",
  ],
  [
    "portable",
    "Console de poche",
    "2000",
    "uncommon",
    "gaming",
    "Un petit écran pour de très grandes aventures.",
  ],
  [
    "tapis",
    "Tapis de danse",
    "2010",
    "uncommon",
    "gaming",
    "Le salon se transformait en piste de danse.",
    2,
  ],
  [
    "borne",
    "Mini-borne étoilée",
    "2010",
    "rare",
    "gaming",
    "Un petit bout de salle d’arcade qui tient sur une étagère.",
  ],
  [
    "cassette",
    "Cassette maison",
    "1990",
    "common",
    "musique",
    "Une sélection patiemment enregistrée, avec une étiquette à la main.",
  ],
  [
    "casque",
    "Casque en mousse",
    "1990",
    "common",
    "musique",
    "Le monde s’éloigne dès qu’on le pose sur ses oreilles.",
  ],
  [
    "cd",
    "Disque irisé",
    "2000",
    "common",
    "musique",
    "Toute une playlist dans un reflet arc-en-ciel.",
  ],
  [
    "baladeur",
    "Baladeur cassette",
    "1990",
    "uncommon",
    "musique",
    "Il fallait parfois un crayon pour rembobiner l’histoire.",
  ],
  [
    "mp3",
    "Lecteur MP3 à pince",
    "2010",
    "uncommon",
    "musique",
    "Un compagnon minuscule avec beaucoup de musique en tête.",
  ],
  [
    "radio",
    "Radio double cassette",
    "2000",
    "rare",
    "musique",
    "Le bon bouton, au bon moment, pour enregistrer sa chanson.",
    2,
  ],
  [
    "disquette",
    "Disquette violette",
    "1990",
    "common",
    "informatique",
    "Un devoir important, une étiquette soigneusement écrite.",
  ],
  [
    "souris",
    "Souris à boule",
    "2000",
    "common",
    "informatique",
    "Sous son ventre, une petite boule faisait tourner le monde.",
  ],
  [
    "usb",
    "Clé USB translucide",
    "2010",
    "common",
    "informatique",
    "Les photos de vacances tenaient enfin dans une poche.",
  ],
  [
    "clavier",
    "Clavier crème",
    "1990",
    "uncommon",
    "informatique",
    "Le cliquetis des premières histoires tapées à deux doigts.",
    2,
  ],
  [
    "ecran",
    "Écran cathodique",
    "2000",
    "rare",
    "informatique",
    "Une fenêtre bombée sur les premiers mondes numériques.",
    2,
  ],
  [
    "robot",
    "Robot de bureau",
    "2010",
    "legendary",
    "informatique",
    "Le gardien silencieux de tous tes petits trésors.",
  ],
  [
    "reveil",
    "Réveil numérique",
    "1990",
    "common",
    "quotidien",
    "Les chiffres rouges veillaient sur les nuits de vacances.",
  ],
  [
    "telephone",
    "Téléphone à clapet",
    "2000",
    "common",
    "quotidien",
    "Refermer le clapet donnait à chaque conversation une vraie fin.",
  ],
  [
    "appareil",
    "Appareil photo de poche",
    "2010",
    "common",
    "quotidien",
    "Des photos parfois floues, des souvenirs toujours nets.",
  ],
  [
    "lampe",
    "Lampe à lave",
    "2000",
    "uncommon",
    "quotidien",
    "Des bulles qui n’ont jamais besoin de se presser.",
  ],
  [
    "etoile",
    "Projecteur d’étoiles",
    "2010",
    "rare",
    "quotidien",
    "Toute une petite galaxie pour le plafond de ta chambre.",
  ],
  [
    "planete",
    "Mobile des planètes",
    "1990",
    "legendary",
    "quotidien",
    "Un univers suspendu qui prend doucement son temps.",
  ],
];
export const catalogue: Definition[] = entries.map(
  ([id, name, period, rarity, collection_id, description, width = 1]) => ({
    id,
    slug: id,
    name,
    period,
    rarity,
    collection_id,
    description,
    width,
    category: collections.find((c) => c.id === collection_id)!.name,
    illustration: `/objects/${id}.svg`,
    surfaces:
      id === "tapis"
        ? ["floor"]
        : width === 2
          ? ["desk", "shelf", "floor"]
          : ["shelf", "desk"],
    active: true,
  }),
);
export const slots = [
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `haut-${i}`,
    surface: "shelf",
    row: "haut",
    index: i,
    x: 165 + i * 87,
    y: 218,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `bas-${i}`,
    surface: "shelf",
    row: "bas",
    index: i,
    x: 165 + i * 87,
    y: 331,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `bureau-${i}`,
    surface: "desk",
    row: "bureau",
    index: i,
    x: 128 + i * 87,
    y: 443,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `sol-${i}`,
    surface: "floor",
    row: "sol",
    index: i,
    x: 480 + i * 87,
    y: 507,
  })),
];
export type Placement = { instanceId: string; slotId: string };
export type Room = {
  theme: "warm" | "pastel" | "night";
  wall: "cream" | "pink" | "blue";
  floor: "honey" | "light" | "dark";
  placements: Placement[];
};
export type Instance = {
  id: string;
  definition_id: string;
  owner_id: string;
  acquired_at: string;
  origin: string;
  reserved_trade: string | null;
};
export const badgeLabels: Record<string, string> = {
  first: "Premier carton",
  decorator: "Comme à la maison",
  collection: "Le grand complet",
  ten: "Chasseur de souvenirs",
  twenty: "Mémoire de grenier",
};
