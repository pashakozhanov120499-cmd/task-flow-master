package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetColumns(t *testing.T) {
	setupTestDB(t)
	
	userID := createTestUser(t)

	board := &models.Board{
		Name:   "Test Board for Columns",
		UserID: &userID,
	}
	err := repository.CreateBoard(board)
	require.NoError(t, err, "Failed to create test board")

	column := &models.Column{
		BoardID:  board.ID,
		Title:    "Test Column",
		StatusID: "test-status",
		Position: 0,
	}
	err = repository.CreateColumn(column)
	require.NoError(t, err, "Failed to create test column")

	t.Run("Get columns by board_id", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/columns?board_id="+board.ID.String(), nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetColumns)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code, "Expected status 200")
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var columns []models.Column
		err = json.Unmarshal(rr.Body.Bytes(), &columns)
		require.NoError(t, err, "Failed to unmarshal response")
		assert.GreaterOrEqual(t, len(columns), 1, "Expected at least one column")
		
		found := false
		for _, c := range columns {
			if c.ID == column.ID {
				found = true
				assert.Equal(t, "Test Column", c.Title)
				assert.Equal(t, "test-status", c.StatusID)
				break
			}
		}
		assert.True(t, found, "Test column not found in response")
	})

	t.Run("Get columns without board_id", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/columns", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetColumns)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected status 400")
	})

	t.Run("Get columns with invalid board_id", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/columns?board_id=invalid-uuid", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetColumns)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected status 400")
	})

	repository.DeleteColumn(column.ID)
	repository.DeleteBoard(board.ID)
}

