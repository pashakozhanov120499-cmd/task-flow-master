package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetBoards(t *testing.T) {
	setupTestDB(t)
	
	userID := createTestUser(t)

	board := &models.Board{
		Name:        "Test Board",
		Description: stringPtr("Test Description"),
		UserID:      &userID,
	}
	err := repository.CreateBoard(board)
	require.NoError(t, err, "Failed to create test board")

	t.Run("Get all boards", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/boards", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetBoards)
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code, "Expected status 200")
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var boards []models.Board
		err = json.Unmarshal(rr.Body.Bytes(), &boards)
		require.NoError(t, err, "Failed to unmarshal response")
		assert.GreaterOrEqual(t, len(boards), 1, "Expected at least one board")
		
		found := false
		for _, b := range boards {
			if b.ID == board.ID {
				found = true
				assert.Equal(t, "Test Board", b.Name)
				assert.Equal(t, "Test Description", *b.Description)
				break
			}
		}
		assert.True(t, found, "Test board not found in response")
	})

	t.Run("Get board by ID", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/boards/"+board.ID.String(), nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router := mux.NewRouter()
		router.HandleFunc("/api/boards/{id}", GetBoard)
		router.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code, "Expected status 200")
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var boardResponse models.Board
		err = json.Unmarshal(rr.Body.Bytes(), &boardResponse)
		require.NoError(t, err, "Failed to unmarshal response")
		assert.Equal(t, board.ID, boardResponse.ID)
		assert.Equal(t, "Test Board", boardResponse.Name)
	})

	t.Run("Get board with invalid ID", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/boards/invalid-uuid", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router := mux.NewRouter()
		router.HandleFunc("/api/boards/{id}", GetBoard)
		router.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected status 400")
	})

	t.Run("Get non-existent board", func(t *testing.T) {
		nonExistentID := uuid.New()
		req, err := http.NewRequest("GET", "/api/boards/"+nonExistentID.String(), nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router := mux.NewRouter()
		router.HandleFunc("/api/boards/{id}", GetBoard)
		router.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code, "Expected status 404")
	})

	repository.DeleteBoard(board.ID)
}

func stringPtr(s string) *string {
	return &s
}

