package handlers

import (
	"encoding/json"
	"net/http"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func GetColumns(w http.ResponseWriter, r *http.Request) {
	boardIDStr := r.URL.Query().Get("board_id")
	if boardIDStr == "" {
		http.Error(w, "board_id parameter is required", http.StatusBadRequest)
		return
	}

	boardID, err := uuid.Parse(boardIDStr)
	if err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	columns, err := repository.GetColumnsByBoardID(boardID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(columns)
}

func CreateColumn(w http.ResponseWriter, r *http.Request) {
	var req models.CreateColumnRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	column := &models.Column{
		BoardID:  req.BoardID,
		Title:    req.Title,
		StatusID: req.StatusID,
		Position: req.Position,
	}

	if err := repository.CreateColumn(column); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	BroadcastColumnUpdate(column.BoardID.String(), "column_created", column)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(column)
}

func DeleteColumn(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid column ID", http.StatusBadRequest)
		return
	}

	column, err := repository.GetColumnByID(id)
	if err != nil {
		http.Error(w, "Column not found", http.StatusNotFound)
		return
	}

	if err := repository.DeleteColumn(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	BroadcastColumnUpdate(column.BoardID.String(), "column_deleted", map[string]string{"id": id.String()})

	w.WriteHeader(http.StatusNoContent)
}

