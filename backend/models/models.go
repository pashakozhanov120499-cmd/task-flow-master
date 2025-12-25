package models

import (
	"time"

	"github.com/google/uuid"
)

type Board struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	UserID      *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	Tasks       []Task     `json:"tasks,omitempty"`
}

type Task struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	BoardID     uuid.UUID  `json:"board_id" db:"board_id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description" db:"description"`
	Status      string     `json:"status" db:"status"`
	Priority    *string    `json:"priority,omitempty" db:"priority"`
	Assignee    *string    `json:"assignee,omitempty" db:"assignee"`
	CreatedBy   *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type Column struct {
	ID       uuid.UUID `json:"id" db:"id"`
	BoardID  uuid.UUID `json:"board_id" db:"board_id"`
	Title    string    `json:"title" db:"title"`
	StatusID string    `json:"status_id" db:"status_id"`
	Position int       `json:"position" db:"position"`
}

type CreateBoardRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type CreateTaskRequest struct {
	BoardID     uuid.UUID `json:"board_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Priority    *string   `json:"priority,omitempty"`
	Assignee    *string   `json:"assignee,omitempty"`
}

type UpdateTaskRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Status      *string `json:"status,omitempty"`
	Priority    *string `json:"priority,omitempty"`
	Assignee    *string `json:"assignee,omitempty"`
}

type CreateColumnRequest struct {
	BoardID  uuid.UUID `json:"board_id"`
	Title    string    `json:"title"`
	StatusID string    `json:"status_id"`
	Position int       `json:"position"`
}

type User struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	PasswordHash string `json:"-" db:"password_hash"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

