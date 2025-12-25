# TaskFlow Frontend

Frontend часть приложения TaskFlow - системы управления задачами с Kanban-доской.

## Технологии

- **React 19** - UI библиотека
- **Vite** - сборщик и dev-сервер
- **TypeScript** - типизация
- **Redux Toolkit** - управление состоянием
- **React Router** - маршрутизация
- **Shadcn UI** - компоненты UI
- **Tailwind CSS** - стилизация
- **@dnd-kit** - drag-and-drop функциональность

## Установка

1. Установите зависимости:
```bash
npm install
```

## Запуск

Запуск dev-сервера:
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка

Сборка для production:
```bash
npm run build
```

## Авторизация

Для входа в систему используйте:
- **Логин:** `admin`
- **Пароль:** `admin123`

## Структура проекта

```
src/
├── components/        # React компоненты
│   ├── ui/           # UI компоненты Shadcn
│   ├── layout/       # Компоненты layout (Header, Sidebar, Footer)
│   └── kanban/       # Компоненты Kanban доски
├── pages/            # Страницы приложения
├── store/            # Redux store и slices
│   ├── slices/       # Redux slices
│   ├── store.ts      # Конфигурация store
│   └── hooks.ts      # Типизированные хуки
└── lib/              # Утилиты
```

## Функциональность

- ✅ Авторизация через JWT (моковая)
- ✅ Welcome экран с анимацией
- ✅ Главная страница с Header, Sidebar и Footer
- ✅ Список досок
- ✅ Kanban доска с drag-and-drop
- ✅ Переключение темы (dark/light)
- ✅ Профиль пользователя

## Темы

Приложение поддерживает темную и светлую темы. Тема сохраняется в localStorage и применяется автоматически при загрузке.
