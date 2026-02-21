# RestoBar SaaS

Sistema web estatico (PWA) para controle de restaurante/bar.

## Build local

```bash
npm install
npm run dev
npm run build
```

A pasta de saida sera `dist/`.

## Deploy no Cloudflare (Workers Assets)

1. Login no Cloudflare:

```bash
npx wrangler login
```

2. Build + preview local pelo runtime do Cloudflare:

```bash
npm run preview:cf
```

3. Deploy para producao:

```bash
npm run deploy:cf
```

Configuracao usada: `wrangler.jsonc` com `assets.directory = ./dist`.

## Alternativa: Cloudflare Pages

No projeto Pages, use:

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (raiz do repositorio)

## Supabase

Projeto configurado:

- Project ID: `fquiicsdvjqzrbeiuaxo`
- URL: `https://fquiicsdvjqzrbeiuaxo.supabase.co`

Para ativar a sincronizacao em nuvem, execute no SQL Editor:

- `supabase/schema.sql`

## Logins de teste

- Admin: `admin` / `admin`
- Garcom: `user` / `user`
- Cozinheiro: `cook` / `cook`