package repository

import (
	"database/sql"
	"task-flow-backend/database"
	"task-flow-backend/models"
	"time"

	"github.com/google/uuid"
)

func GetTasksByBoardID(boardID uuid.UUID) ([]models.Task, error) {
	rows, err := database.DB.Query(`
		SELECT id, board_id, title, description, status, priority, assignee, created_by, created_at, updated_at 
		FROM tasks 
		WHERE board_id = $1 
		ORDER BY created_at DESC
	`, boardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *task)
	}

	return tasks, nil
}

func GetTaskByID(id uuid.UUID) (*models.Task, error) {
	row := database.DB.QueryRow(`
		SELECT id, board_id, title, description, status, priority, assignee, created_by, created_at, updated_at 
		FROM tasks 
		WHERE id = $1
	`, id)

	return scanTaskFromRow(row)
}

func CreateTask(task *models.Task) error {
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()

	var createdBy interface{}
	if task.CreatedBy != nil {
		createdBy = *task.CreatedBy
	} else {
		createdBy = nil
	}

	err := database.DB.QueryRow(`
		INSERT INTO tasks (board_id, title, description, status, priority, assignee, created_by, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
		RETURNING id
	`, task.BoardID, task.Title, task.Description, task.Status, task.Priority, task.Assignee, createdBy, task.CreatedAt, task.UpdatedAt).Scan(&task.ID)

	return err
}

func UpdateTask(task *models.Task) error {
	task.UpdatedAt = time.Now()

	_, err := database.DB.Exec(`
		UPDATE tasks 
		SET title = $1, description = $2, status = $3, priority = $4, assignee = $5, updated_at = $6 
		WHERE id = $7
	`, task.Title, task.Description, task.Status, task.Priority, task.Assignee, task.UpdatedAt, task.ID)

	return err
}

func DeleteTask(id uuid.UUID) error {
	_, err := database.DB.Exec("DELETE FROM tasks WHERE id = $1", id)
	return err
}

func MoveTask(taskID uuid.UUID, newStatus string) error {
	_, err := database.DB.Exec(`
		UPDATE tasks 
		SET status = $1, updated_at = $2 
		WHERE id = $3
	`, newStatus, time.Now(), taskID)
	return err
}

func scanTask(rows *sql.Rows) (*models.Task, error) {
	var task models.Task
	var priority, assignee sql.NullString
	var createdBy sql.NullString

	err := rows.Scan(
		&task.ID,
		&task.BoardID,
		&task.Title,
		&task.Description,
		&task.Status,
		&priority,
		&assignee,
		&createdBy,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if priority.Valid {
		task.Priority = &priority.String
	}
	if assignee.Valid {
		task.Assignee = &assignee.String
	}
	if createdBy.Valid && createdBy.String != "" {
		createdByUUID, err := uuid.Parse(createdBy.String)
		if err == nil {
			task.CreatedBy = &createdByUUID
		}
	}

	return &task, nil
}

func scanTaskFromRow(row *sql.Row) (*models.Task, error) {
	var task models.Task
	var priority, assignee sql.NullString
	var createdBy sql.NullString

	err := row.Scan(
		&task.ID,
		&task.BoardID,
		&task.Title,
		&task.Description,
		&task.Status,
		&priority,
		&assignee,
		&createdBy,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if priority.Valid {
		task.Priority = &priority.String
	}
	if assignee.Valid {
		task.Assignee = &assignee.String
	}
	if createdBy.Valid && createdBy.String != "" {
		createdByUUID, err := uuid.Parse(createdBy.String)
		if err == nil {
			task.CreatedBy = &createdByUUID
		}
	}

	return &task, nil
}

