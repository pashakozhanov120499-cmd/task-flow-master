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

func TestGetTasks(t *testing.T) {
	setupTestDB(t)
	
	userID := createTestUser(t)

	board := &models.Board{
		Name:   "Test Board for Tasks",
		UserID: &userID,
	}
	err := repository.CreateBoard(board)
	require.NoError(t, err, "Failed to create test board")

	task := &models.Task{
		BoardID:     board.ID,
		Title:       "Test Task",
		Description: "Test Description",
		Status:      "plan",
		CreatedBy:   &userID,
	}
	err = repository.CreateTask(task)
	require.NoError(t, err, "Failed to create test task")

	t.Run("Get tasks by board_id", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/tasks?board_id="+board.ID.String(), nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetTasks)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code, "Expected status 200")
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var tasks []models.Task
		err = json.Unmarshal(rr.Body.Bytes(), &tasks)
		require.NoError(t, err, "Failed to unmarshal response")
		assert.GreaterOrEqual(t, len(tasks), 1, "Expected at least one task")
		
		found := false
		for _, taskItem := range tasks {
			if taskItem.ID == task.ID {
				found = true
				assert.Equal(t, "Test Task", taskItem.Title)
				assert.Equal(t, "Test Description", taskItem.Description)
				break
			}
		}
		assert.True(t, found, "Test task not found in response")
	})

	t.Run("Get all tasks", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/tasks", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetTasks)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code, "Expected status 200")
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var tasks []models.Task
		err = json.Unmarshal(rr.Body.Bytes(), &tasks)
		require.NoError(t, err, "Failed to unmarshal response")
		assert.GreaterOrEqual(t, len(tasks), 1, "Expected at least one task")
	})

	t.Run("Get tasks with invalid board_id", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/tasks?board_id=invalid-uuid", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetTasks)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected status 400")
	})

	repository.DeleteTask(task.ID)
	repository.DeleteBoard(board.ID)
}

