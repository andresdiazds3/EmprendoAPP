# Infraestructura Docker

## 1. Desarrollo local (esto es lo que usas ahora)

Copia `docker-compose.yml` a la **raíz de tu repo** (al mismo nivel que `Backend/` y `Frontend/`).

```bash
docker compose up -d
```

Eso levanta un Postgres en `localhost:5432` con:
- usuario: `emprendedores`
- password: `emprendedores_dev`
- base de datos: `emprendedores_db`

Tu `Backend/.env` debe apuntar a:
```
DATABASE_URL="postgresql://emprendedores:emprendedores_dev@localhost:5432/emprendedores_db?schema=public"
```

Luego, DENTRO de `Backend/`, como siempre:
```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Comandos útiles:
```bash
docker compose ps              # ver si el contenedor está sano (healthy)
docker compose logs -f db      # ver logs de la base de datos
docker compose down            # apagar (los datos persisten en el volumen)
docker compose down -v         # apagar Y borrar los datos (reset total)
```

## 2. Producción — dos caminos

### Camino recomendado: Postgres administrado
Crea una base de datos en **Neon**, **Supabase** o **Railway** (todas tienen
plan gratuito suficiente para este proyecto). Te dan un `DATABASE_URL` ya
armado — lo pegas en las variables de entorno de donde despliegues el backend
(Railway, Render, Fly.io, un VPS, etc.) y corres:
```bash
npx prisma migrate deploy
```
No tienes que administrar backups, réplicas ni parches de Postgres tú mismo.

### Camino alternativo: todo en tu propio VPS
Usa `docker-compose.prod.yml` (colócalo en la raíz del repo, junto con un
`.env.production` con tus variables reales) y:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Esto construye el backend con `Backend/Dockerfile` (cópialo dentro de
`Backend/`) y lo conecta a su propia base de datos en el mismo servidor.
Tú te encargas de los backups del volumen `postgres_data`.

**Para este proyecto, con la fecha de entrega del 3 de septiembre, el camino
recomendado (Postgres administrado) es más rápido de dejar funcionando y con
menos riesgo de perder datos por una mala configuración de Docker en el VPS.**
