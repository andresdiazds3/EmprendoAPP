# Backend — Sistema de Gestión para Emprendedores

Base técnica generada según `02_Documento_Tecnico_Guia.docx` (secciones 2, 3 y 4)
y el objetivo de **Sprint 0** del `03_Sprint_Planning.xlsx`.

## Cómo integrarlo a tu repo

1. Copia todo el contenido de esta carpeta dentro de tu carpeta `Backend/` existente
   (si ya tienes `package.json` u otros archivos ahí, revisa que no se sobreescriban).
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea tu `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
   Y ajusta `DATABASE_URL` con tus credenciales de PostgreSQL local (o Docker).
4. Genera el cliente de Prisma y aplica la primera migración:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Carga los datos de prueba:
   ```bash
   npm run seed
   ```
6. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
7. Verifica que responde en `http://localhost:3000/health`.

## Qué queda listo con esto

- Estructura de carpetas completa según la sección 3 del documento técnico.
- `schema.prisma` con las 9 entidades, relaciones y los índices documentados.
- Config de entorno validada con Zod (`src/config/env.ts`).
- Middlewares base: manejo de errores, autenticación JWT, rate limiting.
- Utilidades compartidas: paginación, formato moneda/fecha, respuesta HTTP estándar.
- Seed de datos de prueba (usuario demo, productos, kardex, una venta, un gasto, un chat).

## Qué falta (empieza en Sprint 1)

Cada carpeta de `src/modules/<módulo>/` tiene un `.gitkeep.md` indicando qué
archivos van ahí (`controller.ts`, `service.ts`, `repository.ts`, `routes.ts`, `dtos/`).
El primer módulo a implementar es **auth** (registro, login, recuperar contraseña),
que es el objetivo de Sprint 1.

Usuario demo tras el seed: `demo@emprendedor.com` / `password123`
