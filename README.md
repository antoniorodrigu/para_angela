# Ángela

Una experiencia web interactiva.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:5178](http://localhost:5178)

## Producción

```bash
npm run build
```

El resultado queda en `dist/`.

## Vista previa

```bash
npm run preview
```

## GitHub Pages

1. Crear un repositorio en GitHub y hacer push del proyecto.
2. Ir a **Settings → Pages**.
3. En **Source**, seleccionar **GitHub Actions**.
4. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente en cada push a `main`.
