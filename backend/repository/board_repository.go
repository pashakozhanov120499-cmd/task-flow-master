package repository

import (
	"database/sql"
	"log"
	"task-flow-backend/database"
	"task-flow-backend/models"
	"time"

	"github.com/google/uuid"
)

func GetAllBoards() ([]models.Board, error) {
	rows, err := database.DB.Query(`
		SELECT b.id, b.name, b.description, b.created_at, b.updated_at,
		       COALESCE(COUNT(t.id), 0) as task_count
		FROM boards b
		LEFT JOIN tasks t ON b.id = t.board_id
		GROUP BY b.id, b.name, b.description, b.created_at, b.updated_at
		ORDER BY b.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boards []models.Board
	for rows.Next() {
		var board models.Board
		var description sql.NullString
		var taskCount int
		err := rows.Scan(&board.ID, &board.Name, &description, &board.CreatedAt, &board.UpdatedAt, &taskCount)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			board.Description = &description.String
		}
		tasks, err := GetTasksByBoardID(board.ID)
		if err == nil {
			board.Tasks = tasks
		}
		boards = append(boards, board)
	}

	return boards, nil
}

func GetBoardByID(id uuid.UUID) (*models.Board, error) {
	var board models.Board
	var description sql.NullString
	err := database.DB.QueryRow(`
		SELECT id, name, description, created_at, updated_at 
		FROM boards 
		WHERE id = $1
	`, id).Scan(&board.ID, &board.Name, &description, &board.CreatedAt, &board.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if description.Valid {
		board.Description = &description.String
	}

	tasks, err := GetTasksByBoardID(id)
	if err == nil {
		board.Tasks = tasks
	}

	return &board, nil
}

func CreateBoard(board *models.Board) error {
	var userID interface{}
	if board.UserID != nil {
		userID = *board.UserID
	} else {
		userID = nil
	}

	err := database.DB.QueryRow(`
		INSERT INTO boards (name, description, user_id) 
		VALUES ($1, $2, $3) 
		RETURNING id, created_at, updated_at
	`, board.Name, board.Description, userID).Scan(&board.ID, &board.CreatedAt, &board.UpdatedAt)

	if err != nil {
		return err
	}

	defaultColumns := []struct {
		title    string
		statusID string
		position int
	}{
		{"План", "plan", 0},
		{"Анализ", "analysis", 1},
		{"Разработка", "development", 2},
		{"Тестирование", "testing", 3},
		{"Закрыто", "closed", 4},
	}

	for _, col := range defaultColumns {
		_, err := database.DB.Exec(`
			INSERT INTO columns (board_id, title, status_id, position)
			VALUES ($1, $2, $3, $4)
		`, board.ID, col.title, col.statusID, col.position)
		if err != nil {
			log.Printf("Warning: Failed to create default column %s for board %s: %v", col.title, board.ID, err)
			continue
		}
	}

	return nil
}

func UpdateBoard(board *models.Board) error {
	board.UpdatedAt = time.Now()
	_, err := database.DB.Exec(`
		UPDATE boards 
		SET name = $1, description = $2, updated_at = $3 
		WHERE id = $4
	`, board.Name, board.Description, board.UpdatedAt, board.ID)
	return err
}

func DeleteBoard(id uuid.UUID) error {
	_, err := database.DB.Exec("DELETE FROM boards WHERE id = $1", id)
	return err
}
