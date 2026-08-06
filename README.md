# VK Mini App «Карты Таро — Расклад дня»

Готовый React 18 + TypeScript + Vite клиент с VKUI, VK Bridge, React Router, Framer Motion и Axios, а также Node.js/Express/PostgreSQL REST API с JWT.

## Возможности
- Splash, авторизация VK, главная, карта дня с 3D-переворотом, расшифровки по сферам жизни.
- Архив, избранное, Premium, профиль, настройки, политика, страницы ошибок и offline.
- Одна карта в сутки, история, избранное, premium-статус, уведомления в схеме БД, шаринг через VK Bridge.
- Темно-синий космический фон, золотые акценты, glassmorphism и адаптивная верстка.

## Быстрый старт
```bash
cp .env.example .env
npm install
npm run dev
```

## Backend
```bash
docker compose up -d db
npm run db:migrate
npm run server:dev
```

## Docker
```bash
docker compose up --build
```

## Скрипты
- `npm run dev` — Vite dev server.
- `npm run build` — TypeScript проверка и production build клиента.
- `npm run server:build` — сборка backend.
- `npm run db:migrate` — применение SQL миграций.
