# Як додати AGENT_SECRET через Vercel Dashboard

> **Status (2026-09-21):** env var НЕ додано. Vercel CLI на цьому хості не має авторизації
> (немає токена в жодному env/credential файлі). Додати через CLI можна тільки після
> `vercel login` — це OAuth device-flow, який потребує підтвердження в браузері.
> Поки що — ручне додавання через Dashboard, як описано нижче.

## Варіант A — Dashboard (рекомендовано, ~2 хв)

1. Зайди на https://vercel.com/dashboard
2. Вибери проєкт **client-hub** (project id: `prj_Q7fqTXMrXJjCjsUGilS3o5xfUcM3`)
3. **Settings → Environment Variables**
4. **Add New** (або **Add Another**, якщо вже є кілька):
   - **Name:** `AGENT_SECRET`
   - **Value:** `misha-zhuk-dev-2026`
   - **Environments:** ✅ Production ✅ Preview ✅ Development (усі три)
5. **Save**
6. Trigger redeploy:
   - **Deployments** → обери **Latest** deployment → **⋯** → **Redeploy**
   - АБО простіше: `git push` новий trivial commit (див. нижче)

## Варіант B — CLI з device-flow (~2 хв, але потребує браузер)

```bash
cd /home/hermes/client-hub
vercel login                # запустить device-flow, дасть URL + user_code
vercel env add AGENT_SECRET production misha-zhuk-dev-2026 --yes
vercel env add AGENT_SECRET preview misha-zhuk-dev-2026 --yes
vercel env add AGENT_SECRET development misha-zhuk-dev-2026 --yes
vercel env ls | grep AGENT_SECRET
```

Після `vercel login` у терміналі з'явиться:
```
Visit https://vercel.com/oauth/device?user_code=XXXX-XXXX
Waiting for authentication...
```
Відкрий цей URL у браузері, підтвердь — і CLI отримає токен, який збережеться в
`/home/hermes/.local/share/com.vercel.cli/auth.json` на наступні запуски.

## Trigger redeploy (після додавання env var)

Варіант 1 — через Dashboard: Deployments → Latest → ⋯ → Redeploy.

Варіант 2 — trivial commit:

```bash
cd /home/hermes/client-hub
echo "" >> README.md
git add README.md
git -c user.email=mzhuk.gth@gmail.com -c user.name="Mykhailo Zhuk" \
  commit -m "chore: trigger redeploy with AGENT_SECRET env"
git push origin main
```

Vercel webhook підхопить push → новий build → deploy → production з новим env.

## Перевірка після deploy

```bash
curl -sS https://<client-hub-domain>.vercel.app/api/health  # або будь-який route, що читає process.env.AGENT_SECRET
```

Або у Vercel Dashboard: Deployments → Latest → Functions → Logs → шукай
`AGENT_SECRET is set` / `Unauthorized` тощо.
