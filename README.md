# IzalApp

Planeación quincenal de finanzas personales: ingresos, gastos fijos, presupuestos, transferencias entre cuentas, tarjetas de crédito y gasolina.

El manual de uso está en [`docs/manual.html`](docs/manual.html).

## Desarrollo

```bash
cp .env.example .env.local   # y completa BETTER_AUTH_SECRET
docker compose up -d         # Postgres en el puerto 5433
npm install
npm run db:migrate
npm run dev
```

Después de cambiar algo en `src/db/schema`, genera la migración con `npm run db:generate`.

## Producción (Docker)

1. Copia `.env.example` a `.env` y completa `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` (la URL con la que abrirás la app).
2. Levanta todo:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

   El servicio `migrate` aplica las migraciones antes de que arranque la app.
3. Cuando ya tengas tu cuenta creada, pon `DISABLE_SIGNUP=true` y vuelve a ejecutar el comando anterior.

En iPhone, abre la app en Safari y usa "Compartir → Agregar a inicio".

## Respaldos

El servicio `backup` guarda un respaldo diario en `BACKUP_DIR` (por defecto `./backups`) y borra los que tengan más de `BACKUP_KEEP_DAYS` días.

Para restaurar uno:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U izalapp -d izalapp --clean --if-exists < backups/izalapp-AAAA-MM-DD_HHMM.dump
```
