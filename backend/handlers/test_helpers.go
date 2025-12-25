package handlers

import (
	"os"
	"path/filepath"
	"testing"
	"task-flow-backend/cache"
	"task-flow-backend/database"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

// setupTestDB инициализирует тестовую БД
// Примечание: для работы тестов требуется запущенная БД через docker-compose
func setupTestDB(t *testing.T) {
	// Используем реальную БД (требуется запущенный docker-compose)
	// В production можно использовать тестовую БД или моки
	if database.DB == nil {
		// Устанавливаем переменные окружения для тестов если они не установлены
		if os.Getenv("DB_HOST") == "" {
			os.Setenv("DB_HOST", "localhost")
			os.Setenv("DB_PORT", "5432")
			os.Setenv("DB_USER", "taskflow")
			os.Setenv("DB_PASSWORD", "taskflow")
			os.Setenv("DB_NAME", "taskflow")
			os.Setenv("DB_SSLMODE", "disable")
		}
		
		// Меняем рабочую директорию на корень проекта для правильного поиска миграций
		wd, _ := os.Getwd()
		if filepath.Base(wd) == "handlers" {
			os.Chdir("..")
		}
		
		err := database.Init()
		require.NoError(t, err, "Failed to initialize test database. Make sure PostgreSQL is running via docker-compose")
	}
	
	// Инициализируем Redis (если не инициализирован), но не требуем его для тестов
	if cache.Client == nil {
		_ = cache.Init() // Игнорируем ошибку - Redis опционален для тестов
	}
}

// createTestUser создает тестового пользователя для тестов
func createTestUser(t *testing.T) uuid.UUID {
	userID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	
	// Проверяем, существует ли пользователь
	existingUser, err := repository.GetUserByUsername("testuser")
	if err == nil && existingUser != nil {
		return existingUser.ID
	}
	
	// Создаем тестового пользователя
	user := &models.User{
		ID:       userID,
		Username: "testuser",
		Email:    "testuser@test.com",
	}
	err = repository.CreateUser(user, "testpass123")
	if err != nil {
		// Если пользователь уже существует, получаем его ID
		existingUser, err := repository.GetUserByUsername("testuser")
		if err == nil && existingUser != nil {
			return existingUser.ID
		}
		require.NoError(t, err, "Failed to create test user")
	}
	
	return user.ID
}

