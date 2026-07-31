export type MonitoredEntity = {
  slug: string;
  name: string;
  category: "ente_control" | "centro_pensamiento";
  /** null = sin logo disponible (bloqueado por protección anti-bot del sitio
   * oficial — ver services/scraper/README.md); se usa un monograma como
   * respaldo en vez de forzar la descarga. */
  logo: string | null;
  initials: string;
};

export const MONITORED_ENTITIES: MonitoredEntity[] = [
  {
    slug: "procuraduria",
    name: "Procuraduría General de la Nación",
    category: "ente_control",
    logo: "/logos/procuraduria.png",
    initials: "PGN",
  },
  {
    slug: "contraloria",
    name: "Contraloría General de la República",
    category: "ente_control",
    logo: "/logos/contraloria.png",
    initials: "CGR",
  },
  {
    slug: "fiscalia",
    name: "Fiscalía General de la Nación",
    category: "ente_control",
    logo: "/logos/fiscalia.jpg",
    initials: "FGN",
  },
  {
    slug: "defensoria",
    name: "Defensoría del Pueblo",
    category: "ente_control",
    logo: "/logos/defensoria.svg",
    initials: "DP",
  },
  {
    slug: "ipl",
    name: "Instituto de Pensamiento Liberal (IPL)",
    category: "centro_pensamiento",
    logo: "/logos/ipl.svg",
    initials: "IPL",
  },
  {
    slug: "fedesarrollo",
    name: "Fedesarrollo",
    category: "centro_pensamiento",
    logo: "/logos/fedesarrollo.png",
    initials: "FDR",
  },
  {
    slug: "dejusticia",
    name: "Dejusticia",
    category: "centro_pensamiento",
    logo: null,
    initials: "DJ",
  },
  {
    slug: "anif",
    name: "ANIF",
    category: "centro_pensamiento",
    logo: "/logos/anif.png",
    initials: "ANIF",
  },
  {
    slug: "banrep",
    name: "Banco de la República",
    category: "centro_pensamiento",
    logo: null,
    initials: "BR",
  },
];

export function getEntityBySlug(slug: string): MonitoredEntity | undefined {
  return MONITORED_ENTITIES.find((e) => e.slug === slug);
}
