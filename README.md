# Космо Кликер: ВК

Готовая HTML5-игра для VK Games / VK Mini Apps в жанре **idle clicker + upgrade + progression loop**. Проект запускается сразу после открытия `index.html` и не требует сборки.

## Коммерческий дизайн

- **Сессии 30–120 секунд:** базовый раунд длится 60 секунд, цель быстро растёт, а проигрыш мотивирует купить апгрейд и мгновенно перезапуститься.
- **Retention:** ежедневный бонус, streak-награды, уровни, XP, постоянные апгрейды и ощущение роста силы.
- **Монетизация:** заготовлены reward ads для x2 награды, revive и бонусной валюты; interstitial ads показываются каждые 3 раунда и при возврате из game over.
- **Вирусность:** кнопка шаринга даёт моментальный бонус и использует Web Share API, если он доступен.
- **VK-ready:** подключён VK Bridge, есть localStorage + VK Storage, stub для leaderboard через `apps.setScore`, структура под VK Ads SDK.

## Файлы

- `index.html` — мобильный HTML5 UI и canvas-слой эффектов.
- `style.css` — mobile-first casual стиль, анимации, крупные кнопки.
- `game.js` — полный игровой цикл, экономика, реклама, daily rewards, VK Bridge.
- `manifest.json` — PWA/VK-ready manifest.

## Запуск

Откройте `index.html` в браузере или запустите локальный сервер:

```bash
python3 -m http.server 8000
```

Затем откройте `http://localhost:8000`.

## Игровой цикл

1. Игрок сразу видит большую планету и начинает тапать.
2. За 60 секунд нужно набрать цель раунда.
3. Победа открывает следующий раунд, поражение показывает «почти получилось» и revive за reward ad.
4. Звёзды тратятся на постоянные апгрейды тапа и idle-дронов.
5. XP повышает уровень, иногда выдаёт premium currency.

## Интеграции для продакшена

Текущие рекламные вызовы работают как безопасные stubs и показывают toast. В VK окружении `game.js` дополнительно вызывает:

- `VKWebAppInit`
- `VKWebAppStorageGet` / `VKWebAppStorageSet`
- `VKWebAppShowNativeAds` для reward/interstitial форматов
- `VKWebAppCallAPIMethod` с `apps.setScore` как заготовку leaderboard

Перед публикацией замените параметры API на значения вашего VK-приложения и подключите реальные placements в кабинете VK Games.
