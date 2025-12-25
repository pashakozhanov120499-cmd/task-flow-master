package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func GetBoards(w http.ResponseWriter, r *http.Request) {
	boards, err := repository.GetAllBoards()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(boards)
}

func GetBoard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	board, err := repository.GetBoardByID(id)
	if err != nil {
		http.Error(w, "Board not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(board)
}

func CreateBoard(w http.ResponseWriter, r *http.Request) {
	var req models.CreateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("CreateBoard request: Name=%s, Description=%v", req.Name, req.Description)

	if req.Name == "" {
		http.Error(w, "Board name is required", http.StatusBadRequest)
		return
	}

	var description *string
	if req.Description != nil && *req.Description != "" {
		description = req.Description
	}

	// Получаем userID из контекста
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	var boardUserID *uuid.UUID
	if ok {
		boardUserID = &userID
	}

	board := &models.Board{
		Name:        req.Name,
		Description: description,
		UserID:      boardUserID,
	}

	if err := repository.CreateBoard(board); err != nil {
		log.Printf("Error creating board: %v", err)
		http.Error(w, "Failed to create board: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Board created successfully: ID=%s, Name=%s", board.ID, board.Name)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(board); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func UpdateBoard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	var req models.CreateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	board := &models.Board{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := repository.UpdateBoard(board); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(board)
}

func DeleteBoard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	if err := repository.DeleteBoard(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
