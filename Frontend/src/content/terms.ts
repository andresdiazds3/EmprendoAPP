export const TERMS_LAST_UPDATED = "24 de septiembre de 2026";

export interface TermSection {
  id: number;
  title: string;
  content: string;
}

export const TERMS_SECTIONS: TermSection[] = [
  {
    id: 1,
    title: "1. Aceptación de los términos",
    content:
      "Al crear una cuenta y usar Emprendo, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no debes usar la aplicación.",
  },
  {
    id: 2,
    title: "2. Descripción del servicio",
    content:
      "Emprendo es una aplicación desarrollada como proyecto académico, pensada para ayudar a pequeños emprendedores a gestionar productos, inventario, ventas, gastos y reportes de su negocio, e incluye un asistente basado en inteligencia artificial que responde preguntas sobre la información registrada por el propio usuario.",
  },
  {
    id: 3,
    title: "3. Responsabilidad del usuario",
    content:
      "Eres responsable de la exactitud de la información que registras (productos, precios, ventas, gastos) y de mantener segura tu contraseña. Emprendo no se hace responsable por decisiones de negocio tomadas con base en la información generada por la aplicación o por el asistente de inteligencia artificial, cuyas respuestas pueden contener errores.",
  },
  {
    id: 4,
    title: "4. Uso aceptable",
    content:
      "No está permitido usar la aplicación para fines ilegales, ni intentar acceder a información de otros usuarios, ni interferir con el funcionamiento del servicio.",
  },
  {
    id: 5,
    title: "5. Disponibilidad del servicio",
    content:
      "Al ser un proyecto académico, Emprendo no garantiza disponibilidad continua ni ausencia de errores. El servicio puede discontinuarse o modificarse sin previo aviso.",
  },
  {
    id: 6,
    title: "6. Modificaciones",
    content:
      "Estos términos pueden actualizarse. Si los cambios son significativos, se notificará a los usuarios dentro de la aplicación.",
  },
  {
    id: 7,
    title: "7. Contacto",
    content:
      "Para preguntas sobre estos términos, puedes contactar al equipo de desarrollo del proyecto a través del colegio Rafael Navia Varón.",
  },
];
