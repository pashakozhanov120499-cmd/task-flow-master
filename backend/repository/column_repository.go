package repository

import (
	"task-flow-backend/database"
	"task-flow-backend/models"

	"github.com/google/uuid"
)

func GetColumnsByBoardID(boardID uuid.UUID) ([]models.Column, error) {
	rows, err := database.DB.Query(`
		SELECT id, board_id, title, status_id, position 
		FROM columns 
		WHERE board_id = $1 
		ORDER BY position ASC
	`, boardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []models.Column
	for rows.Next() {
		var column models.Column
		err := rows.Scan(&column.ID, &column.BoardID, &column.Title, &column.StatusID, &column.Position)
		if err != nil {
			return nil, err
		}
		columns = append(columns, column)
	}

	return columns, nil
}

func CreateColumn(column *models.Column) error {
	err := database.DB.QueryRow(`
		INSERT INTO columns (board_id, title, status_id, position) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id
	`, column.BoardID, column.Title, column.StatusID, column.Position).Scan(&column.ID)

	return err
}

func GetColumnByID(id uuid.UUID) (*models.Column, error) {
	var column models.Column
	err := database.DB.QueryRow(`
		SELECT id, board_id, title, status_id, position 
		FROM columns 
		WHERE id = $1
	`, id).Scan(&column.ID, &column.BoardID, &column.Title, &column.StatusID, &column.Position)

	if err != nil {
		return nil, err
	}

	return &column, nil
}

func DeleteColumn(id uuid.UUID) error {
	_, err := database.DB.Exec("DELETE FROM columns WHERE id = $1", id)
	return err
}

