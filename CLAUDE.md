# Штаб Барбершоп — лендинг

Одностраничный сайт барбершопа «Штаб» (Суми, вул. Воскресенська, 15). Тексты на украинском.
Цель страницы одна: запись онлайн через BloknotApp `https://blknt.cc/ae1f47dc`.

## Стек

Статический сайт без сборки: HTML + CSS + vanilla JS, анимации на GSAP 3.15
(core, ScrollTrigger, SplitText, ScrambleText; файлы лежат в `public/assets/js/vendor`, CDN не нужен).
Шрифт Manrope (кириллица, латиница, знак ₴) хостится локально.

## Структура

- `public/index.html` — вся страница; лого (инлайн SVG с отдельными path по буквам) и спрайт иконок Phosphor вставлены прямо в HTML.
- `public/assets/css/style.css` — mobile first, брейкпоинты 640 / 768 / 1024.
- `public/assets/js/main.js` — статус «відчинено/зачинено» (Europe/Kyiv), меню, FAQ, все анимации.
- `public/assets/img` — WebP; `works/` фото работ, `team/` фото мастеров, `logo.svg`, `og.jpg`, фавиконки.
- `public/404.html` — брендированная 404 (абсолютные пути, отдаёт nginx).
- `deploy/nginx.conf`, `Dockerfile`, `docker-compose.yml` (локально), `docker-compose.prod.yml` (VPS).
- `.local/source/` — исходники картинок из Instagram и BloknotApp (в git не идут).

## Источники данных

- Прайс и длительности — онлайн-запись BloknotApp + пост «Прайс лист» в Instagram (29.05.2026).
  На сайте две колонки: «Барбер» и «Старший барбер». Колонку «Молодший барбер» из Instagram
  (400/300/500/200/400/100/100/500/400) не выводим: в онлайн-записи сейчас нет молодших барберов.
- Мастера: Станіслав Таран, Аліна Зуй, Ірма Дробязко — старші барбери; Юлія Баєнко — барбер.
- Hero — фото зала из поста Instagram `DcOsB_MN7Wr` (4032×3024): `hero-720/1080` целиком 4:3 для телефонов,
  `hero-desktop-600/900` кроп 3:4 на стену с шевронами для десктопа (`<picture>`).
- Фото мастеров из BloknotApp только 256×341; `og.jpg` собран с фото Станіслава (апскейл). Нужны оригиналы.
- Видео в «Про нас» — рилс `DXMH37GjTZv` (фасад → зала), только видеодорожка без музыки из Instagram,
  `assets/video/shtab-walkthrough.mp4` 540×960 H.264 ~1.4 MB, затемнение на стыке цикла. Играет только в зоне
  видимости, кнопка пауза/play; при reduced motion и Save-Data не стартует сам.
- Сертификат: сумма любая, 6 месяцев, на все услуги и продукцию, нужна предварительная запись.

## Ключевые решения

- Один шрифт Manrope, веса 400–700; фоны только плоские (#000, #131209, #181818…); золото бренда `#b39468`.
- Анимации только transform/opacity, кривая `power4.out` = `cubic-bezier(0.22, 1, 0.36, 1)`.
- `gsap.matchMedia()`: reduced motion → только fade; десктоп → пин горизонтальной галереи (создаётся первым,
  `refreshPriority: 1`); мобильные → нативный свайп со scroll-snap, нижняя плашка «Записатися онлайн».
- Hover только под `(hover: hover) and (pointer: fine)`, hero `100svh`, safe-area для фиксированных панелей.
- Без JS всё видно: скрыт только hero до старта интро (класс `js-anim`, снимается максимум через 3 с).

## Запуск

```powershell
# локально без Docker
npx serve public            # или: python -m http.server 8080 -d public
# локально в Docker
docker compose up
```

Прод (VPS): `docker compose -f docker-compose.prod.yml up -d --build`, хостовый Nginx проксирует домен на `127.0.0.1:8080`, healthcheck `/api/health`.

GitHub Pages: репозиторий `MaksymZui/shtab.barbershop`, каждый push в `main` публикует `public/` через
`.github/workflows/pages.yml` → https://maksymzui.github.io/shtab.barbershop/
При переезде на свой домен поменять `og:url` и `og:image` в `index.html` (там абсолютный URL для превью ссылок).

После правок CSS/JS увеличить `?v=` в ссылках `index.html` (ассеты кешируются на 7 дней).

## Текущий этап

Лендинг собран и опубликован на GitHub Pages. Открыто: свой домен, оригиналы фото мастеров, подтверждение колонки «Молодший барбер».
