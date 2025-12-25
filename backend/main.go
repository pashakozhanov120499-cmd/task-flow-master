package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"task-flow-backend/cache"
	"task-flow-backend/database"
	"task-flow-backend/handlers"
	"task-flow-backend/websocket"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v. Using system environment variables.", err)
	}

	if err := database.Init(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.DB.Close()

	if err := cache.Init(); err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v. Continuing without cache.", err)
	} else {
		log.Println("Redis cache initialized successfully")
		defer cache.Client.Close()
	}

	r := mux.NewRouter()

	r.Use(handlers.CORSMiddleware)

	wsHub := websocket.NewHub()
	go wsHub.Run()

	handlers.SetWebSocketHub(wsHub)

	r.HandleFunc("/api/auth/login", handlers.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/auth/register", handlers.Register).Methods("POST", "OPTIONS")

	api := r.PathPrefix("/api").Subrouter()
	api.Use(handlers.AuthMiddleware)

	api.HandleFunc("/auth/me", handlers.GetCurrentUser).Methods("GET", "OPTIONS")

	r.HandleFunc("/api/boards", handlers.GetBoards).Methods("GET", "OPTIONS")
	api.HandleFunc("/boards", handlers.CreateBoard).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/boards/{id}", handlers.GetBoard).Methods("GET", "OPTIONS")
	api.HandleFunc("/boards/{id}", handlers.UpdateBoard).Methods("PUT", "OPTIONS")
	api.HandleFunc("/boards/{id}", handlers.DeleteBoard).Methods("DELETE", "OPTIONS")

	r.HandleFunc("/api/tasks", handlers.GetTasks).Methods("GET", "OPTIONS")
	api.HandleFunc("/tasks", handlers.CreateTask).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/tasks/{id}", handlers.GetTask).Methods("GET", "OPTIONS")
	api.HandleFunc("/tasks/{id}", handlers.UpdateTask).Methods("PUT", "OPTIONS")
	api.HandleFunc("/tasks/{id}", handlers.DeleteTask).Methods("DELETE", "OPTIONS")
	api.HandleFunc("/tasks/{id}/move", handlers.MoveTask).Methods("PATCH", "OPTIONS")

	r.HandleFunc("/api/columns", handlers.GetColumns).Methods("GET", "OPTIONS")
	api.HandleFunc("/columns", handlers.CreateColumn).Methods("POST", "OPTIONS")
	api.HandleFunc("/columns/{id}", handlers.DeleteColumn).Methods("DELETE", "OPTIONS")

	r.HandleFunc("/ws/board/{board_id}", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWS(wsHub, w, r)
	}).Methods("GET")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
