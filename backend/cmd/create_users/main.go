package main

import (
	"fmt"
	"log"
	"task-flow-backend/database"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	if err := database.Init(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.DB.Close()

	users := []struct {
		username string
		email    string
		password string
	}{
		{"admin", "admin@taskflow.com", "admin123"},
		{"user1", "user1@taskflow.com", "user123"},
		{"user2", "user2@taskflow.com", "user223"},
	}

	for _, u := range users {
		existingUser, err := repository.GetUserByUsername(u.username)
		if err != nil {
			log.Printf("Error checking user %s: %v", u.username, err)
			continue
		}

		if existingUser != nil {
			fmt.Printf("User %s already exists, skipping...\n", u.username)
			continue
		}

		user := &models.User{
			Username: u.username,
			Email:    u.email,
		}

		if err := repository.CreateUser(user, u.password); err != nil {
			log.Printf("Failed to create user %s: %v", u.username, err)
			continue
		}

		fmt.Printf("Created user: %s (%s)\n", u.username, u.email)
	}

	fmt.Println("Done!")
}

