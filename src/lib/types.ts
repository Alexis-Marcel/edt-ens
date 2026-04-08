export interface TimetableEvent {
  id: string;
  title: string;       // Course name (e.g. "Modélisation Solides")
  code: string;        // Course code (e.g. "UE212")
  start: string;       // ISO datetime
  end: string;         // ISO datetime
  classes: string[];   // ["GC", "GM", "GE"] or subset
  group?: string;      // "Gr1", "Gr2", or undefined (whole class)
  location?: string;
  teacher?: string;
  type?: string;       // "CM", "TD", "TP", "BE", "Examen", etc.
  rawText: string;     // Original cell text for debugging
}

export interface ClassConfig {
  id: string;
  label: string;
  color: string;
}

export const CLASSES: ClassConfig[] = [
  { id: "GC", label: "GC — Génie Civil", color: "#3b82f6" },
  { id: "GM", label: "GM — Génie Mécanique", color: "#10b981" },
  { id: "GE", label: "GE — Génie Électrique", color: "#f59e0b" },
];

export const COURSE_NAMES: Record<string, string> = {
  "207": "Anglais",
  "208": "Défis pluridisciplinaires",
  "211": "Identification et optimisation",
  "212": "Modélisation solides",
  "213": "Modélisation fluides",
  "214": "Physique statistique",
  "215": "Probabilités",
  "221": "Comportement ouvrages",
  "222": "Éco-conception habitat",
  "223": "Conception structures acier",
  "224": "Matériaux et structures béton",
  "225": "Transfert milieux poreux",
  "231": "Électronique numérique",
  "232": "Physique semi-conducteurs",
  "233": "Traitement de l'énergie",
  "234": "Signaux et commande",
  "235": "Électromagnétisme",
  "240": "AutoFormation Catia",
  "241": "Ingénierie de Conception",
  "242": "Mécanismes et contact",
  "243": "Modélisation géométrique",
  "244": "Commande mécatronique",
  "245": "Physique procédés fabrication",
};

// Color per course code (used to color events in the calendar)
export const COURSE_COLORS: Record<string, string> = {
  "207": "#06b6d4", // Anglais — cyan
  "208": "#6366f1", // Défis pluridisciplinaires — indigo
  "211": "#14b8a6", // Identification et optimisation — teal
  "212": "#475569", // Modélisation solides — slate
  "213": "#0ea5e9", // Modélisation fluides — sky
  "214": "#84cc16", // Physique statistique — lime
  "215": "#be185d", // Probabilités — rose foncé
  "221": "#a16207", // Comportement ouvrages — amber foncé
  "222": "#059669", // Éco-conception habitat — emerald
  "223": "#15803d", // Conception structures acier — vert foncé
  "224": "#c2410c", // Matériaux et structures béton — orange foncé
  "225": "#78716c", // Transfert milieux poreux — stone
  "231": "#6b21a8", // Électronique numérique — violet foncé
  "232": "#1e3a8a", // Physique semi-conducteurs — bleu foncé
  "233": "#d946ef", // Traitement de l'énergie — fuchsia
  "234": "#2563eb", // Signaux et commande — bleu
  "235": "#fb923c", // Électromagnétisme — orange clair
  "240": "#6b7280", // AutoFormation Catia — gris
  "241": "#4ade80", // Ingénierie de Conception — vert clair
  "242": "#52525b", // Mécanismes et contact — zinc
  "243": "#dc2626", // Modélisation géométrique — rouge
  "244": "#ec4899", // Commande mécatronique — rose
  "245": "#7f1d1d", // Physique procédés fabrication — bordeaux
};

// Color used for "Projet" events (no course code)
export const PROJECT_COLOR = "#eab308"; // jaune

// Which classes each course belongs to
export const COURSE_CLASSES: Record<string, string[]> = {
  "207": ["GC", "GM", "GE"],
  "208": ["GC", "GM", "GE"],
  "211": ["GC", "GM", "GE"],
  "212": ["GC", "GM"],
  "213": ["GC", "GM"],
  "214": ["GE"],
  "215": ["GE"],
  "221": ["GC"],
  "222": ["GC"],
  "223": ["GC"],
  "224": ["GC"],
  "225": ["GC"],
  "231": ["GE"],
  "232": ["GE"],
  "233": ["GE"],
  "234": ["GE"],
  "235": ["GE"],
  "240": ["GM"],
  "241": ["GM"],
  "242": ["GM"],
  "243": ["GM"],
  "244": ["GM"],
  "245": ["GM"],
};
