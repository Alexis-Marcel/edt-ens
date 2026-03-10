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
