export interface CreditItem {
  label: string;
  value: string;
}

export const CREDITS = {
  appName: "EMPRENDO",
  subtitle: "Proyecto académico",
  items: [
    { label: "Colegio", value: "Rafael Navia Varón" },
    { label: "Grado", value: "11-2" },
    { label: "Creadora", value: "María Alejandra Arraez Quijano" },
    { label: "Docente", value: "David Parra" },
  ] as CreditItem[],
};
