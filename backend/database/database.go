package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Init() error {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "taskflow"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "taskflow"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "taskflow"
	}
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	var err error
	DB, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

func runMigrations() error {
	wd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get working directory: %w", err)
	}

	migrations := []string{"001_init.sql", "002_add_users.sql"}

	for _, migrationFile := range migrations {
		possiblePaths := []string{
			filepath.Join(wd, "migrations", migrationFile),
			filepath.Join(wd, "backend", "migrations", migrationFile),
			filepath.Join(filepath.Dir(wd), "backend", "migrations", migrationFile),
		}

		var migrationPath string
		for _, path := range possiblePaths {
			if _, err := os.Stat(path); err == nil {
				migrationPath = path
				break
			}
		}

		if migrationPath == "" {
			return fmt.Errorf("migration file %s not found in any of: %v", migrationFile, possiblePaths)
		}

		sqlBytes, err := os.ReadFile(migrationPath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", migrationFile, err)
		}

		_, err = DB.Exec(string(sqlBytes))
		if err != nil {
			if !isTableExistsError(err) {
				return fmt.Errorf("failed to execute migration %s: %w", migrationFile, err)
			}
		}
	}

	return nil
}

func isTableExistsError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return strings.Contains(errStr, "already exists") || strings.Contains(errStr, "duplicate")
}


