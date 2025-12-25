# Task Flow Backend

Backend сервер для Task Flow на Go с PostgreSQL, Redis и WebSocket для real-time обновлений.

## Требования

- Go 1.21 или выше
- Docker и Docker Compose
- PostgreSQL (через Docker)
- Redis (через Docker, опционально - для кэширования)

## Установка и запуск

1. Установите зависимости:
```bash
go mod download
```

2. Запустите PostgreSQL и Redis через Docker:
```bash
cd backend
docker-compose up -d
```

База данных будет создана автоматически. Миграции применяются автоматически при запуске сервера.

3. Настройте переменные окружения:
Создайте файл `.env` в папке `backend/` со следующим содержимым:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=taskflow
DB_PASSWORD=taskflow
DB_NAME=taskflow
DB_SSLMODE=disable

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=8080

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here
```

**Важно:** Замените `JWT_SECRET` на случайную строку для безопасности в production.

4. Создайте тестовых пользователей:
```bash
cd backend
go run cmd/create_users/main.go
```

Это создаст 3 пользователя:
- `admin` / `admin123` (admin@taskflow.com)
- `user1` / `user123` (user1@taskflow.com)
- `user2` / `user223` (user2@taskflow.com)

5. Запустите сервер:
```bash
go run main.go
```

Сервер будет доступен на `http://localhost:8080`

## API Endpoints

### Авторизация (Auth) - Публичные
- `POST /api/auth/login` - Войти (требует `username` и `password`)
  - Возвращает: `{ "token": "...", "user": {...} }`
- `POST /api/auth/register` - Зарегистрироваться (требует `username`, `email`, `password`)
  - Минимальная длина пароля: 6 символов
  - Возвращает: `{ "token": "...", "user": {...} }`

### Пользователь - Защищенные (требуют JWT токен)
- `GET /api/auth/me` - Получить текущего пользователя
  - Требует заголовок: `Authorization: Bearer <token>`

### Доски (Boards)
- `GET /api/boards` - Получить все доски (публичный)
- `GET /api/boards/{id}` - Получить доску по ID (публичный)
- `POST /api/boards` - Создать доску (требует JWT токен)
- `PUT /api/boards/{id}` - Обновить доску (требует JWT токен)
- `DELETE /api/boards/{id}` - Удалить доску (требует JWT токен)

### Задачи (Tasks)
- `GET /api/tasks?board_id={id}` - Получить все задачи или по board_id (публичный)
- `GET /api/tasks/{id}` - Получить задачу по ID (публичный)
- `POST /api/tasks` - Создать задачу (требует JWT токен)
- `PUT /api/tasks/{id}` - Обновить задачу (требует JWT токен)
- `DELETE /api/tasks/{id}` - Удалить задачу (требует JWT токен)
- `PATCH /api/tasks/{id}/move` - Переместить задачу (изменить статус) (требует JWT токен)
  - Тело запроса: `{ "status": "new_status_id" }`

### Колонки (Columns)
- `GET /api/columns?board_id={id}` - Получить колонки доски (публичный)
- `POST /api/columns` - Создать колонку (требует JWT токен)
- `DELETE /api/columns/{id}` - Удалить колонку (требует JWT токен)

### WebSocket - Real-time обновления
- `WS /ws/board/{board_id}` - WebSocket соединение для real-time обновлений доски
  - Подключается автоматически при открытии доски на frontend
  - Отправляет события: `task_created`, `task_updated`, `task_moved`, `task_deleted`, `column_created`, `column_deleted`
  - Формат сообщения: `{ "type": "event_type", "board_id": "...", "data": {...} }`

## Структура проекта

```
backend/
├── auth/              # JWT авторизация
│   └── jwt.go         # Генерация и валидация JWT токенов
├── cache/             # Redis кэширование
│   └── cache.go       # Функции кэширования задач
├── cmd/               # Исполняемые команды
│   └── create_users/  # Скрипт создания тестовых пользователей
│       └── main.go
├── database/          # Подключение к БД и миграции
│   └── database.go    # Инициализация БД и применение миграций
├── handlers/          # HTTP обработчики
│   ├── auth_handler.go      # Обработчики авторизации
│   ├── auth_middleware.go   # Middleware для проверки JWT
│   ├── board_handler.go     # Обработчики досок
│   ├── column_handler.go    # Обработчики колонок
│   ├── middleware.go        # CORS middleware
│   ├── task_handler.go      # Обработчики задач
│   └── websocket.go         # Интеграция WebSocket с handlers
├── migrations/        # SQL миграции
│   ├── 001_init.sql   # Создание таблиц boards, tasks, columns
│   └── 002_add_users.sql # Создание таблицы users
├── models/            # Модели данных
│   └── models.go      # Структуры Board, Task, Column, User
├── repository/        # Слой доступа к данным
│   ├── board_repository.go   # CRUD операции для досок
│   ├── column_repository.go  # CRUD операции для колонок
│   ├── task_repository.go    # CRUD операции для задач
│   └── user_repository.go    # CRUD операции для пользователей
├── websocket/         # WebSocket для real-time обновлений
│   ├── hub.go         # Hub для управления подключениями
│   ├── client.go      # WebSocket клиент
│   └── handler.go     # Обработчик WebSocket соединений
├── main.go           # Точка входа
├── .env              # Переменные окружения (создать вручную)
├── docker-compose.yml # Конфигурация PostgreSQL и Redis
├── go.mod            # Go модули
└── README.md         # Документация
```

## База данных

База данных настраивается автоматически при первом запуске. Таблицы:
- `users` - Пользователи системы
- `boards` - Доски проектов (с полем `created_by` для отслеживания создателя)
- `tasks` - Задачи (с полем `created_by` для отслеживания создателя)
- `columns` - Колонки (статусы) для досок

При создании новой доски автоматически создаются 5 дефолтных колонок:
- План (plan)
- Анализ (analysis)
- Разработка (development)
- Тестирование (testing)
- Закрыто (closed)

## Кэширование

Проект использует Redis для кэширования списков задач. Кэш автоматически инвалидируется при создании, обновлении или удалении задач.

Время жизни кэша: 5 минут.

Если Redis недоступен, приложение продолжит работу без кэширования (с предупреждением в логах).

## Авторизация

Проект использует JWT (JSON Web Tokens) для авторизации. 

- При логине/регистрации пользователь получает JWT токен
- Токен должен передаваться в заголовке `Authorization: Bearer <token>`
- Токен действителен 24 часа
- Секретный ключ JWT настраивается через переменную окружения `JWT_SECRET` в файле `.env`
- **Важно:** В production используйте сильный случайный ключ для `JWT_SECRET`

### Защищенные endpoints

Большинство endpoints требуют JWT токен в заголовке `Authorization`. Исключения:
- `POST /api/auth/login` - публичный
- `POST /api/auth/register` - публичный
- `GET /api/boards` - публичный (для просмотра)
- `GET /api/boards/{id}` - публичный (для просмотра)
- `GET /api/tasks` - публичный (для просмотра)
- `GET /api/tasks/{id}` - публичный (для просмотра)
- `GET /api/columns` - публичный (для просмотра)

## Real-time обновления (WebSocket)

Проект поддерживает real-time синхронизацию изменений между пользователями через WebSocket:

- При открытии доски автоматически устанавливается WebSocket соединение
- Все изменения (создание, обновление, удаление, перемещение задач) мгновенно отображаются у всех подключенных пользователей
- Не требуется обновление страницы для синхронизации
- Автоматическое переподключение при разрыве соединения

### События WebSocket

- `task_created` - новая задача создана
- `task_updated` - задача обновлена
- `task_moved` - задача перемещена между колонками
- `task_deleted` - задача удалена
- `column_created` - новая колонка создана
- `column_deleted` - колонка удалена

## Совместная работа

Все пользователи могут видеть и работать с одними и теми же досками. 

- При создании доски или задачи сохраняется информация о создателе (`created_by`), что позволяет отслеживать, кто создал элемент
- Изменения синхронизируются в реальном времени через WebSocket
- Несколько пользователей могут одновременно работать на одной доске

