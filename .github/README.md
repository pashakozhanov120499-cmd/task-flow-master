# GitHub Actions Workflows

Этот проект использует GitHub Actions для автоматизации CI/CD процессов.

## Доступные Workflows

### 1. CI (`ci.yml`)
Основной workflow, который запускается при каждом push и pull request в ветки `main` и `develop`.

**Frontend:**
- Установка зависимостей
- Линтинг кода (ESLint)
- Запуск тестов (Vitest)
- Проверка TypeScript
- Сборка проекта

**Backend:**
- Установка зависимостей Go
- Запуск тестов с PostgreSQL и Redis
- Генерация coverage отчета
- Сборка бинарных файлов для Linux, macOS и Windows

### 2. Frontend CI (`frontend.yml`)
Отдельный workflow для frontend, запускается при изменениях в папке `frontend/`.

### 3. Backend CI (`backend.yml`)
Отдельный workflow для backend, запускается при изменениях в папке `backend/`.

### 4. CodeQL Analysis (`codeql.yml`)
Автоматический анализ безопасности кода для JavaScript и Go.

### 5. Dependency Review (`dependency-review.yml`)
Проверка зависимостей в pull request'ах на наличие уязвимостей.

## Dependabot

Настроен автоматический обновление зависимостей:
- NPM пакеты (frontend) - еженедельно
- Go модули (backend) - еженедельно
- GitHub Actions - еженедельно

## Secrets

Для работы некоторых workflows могут потребоваться следующие secrets (настраиваются в Settings → Secrets and variables → Actions):

- `VITE_API_URL` - URL API для сборки frontend (опционально)

## Artifacts

После успешной сборки создаются артефакты:
- `frontend-dist` - собранный frontend
- `backend-binaries` - скомпилированные бинарники для разных платформ

Артефакты хранятся 7 дней.

