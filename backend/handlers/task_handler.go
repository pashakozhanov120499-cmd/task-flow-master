package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
	"task-flow-backend/cache"
	"task-flow-backend/models"
	"task-flow-backend/repository"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

const cacheExpiration = 5 * time.Minute

func GetTasks(w http.ResponseWriter, r *http.Request) {
	boardIDStr := r.URL.Query().Get("board_id")
	
	if boardIDStr == "" {
		if cachedData, err := cache.GetAllTasks(); err == nil && cachedData != nil {
			var cachedTasks []models.Task
			if err := json.Unmarshal(cachedData, &cachedTasks); err == nil {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(cachedTasks)
				return
			}
		}

		boards, err := repository.GetAllBoards()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var allTasks []models.Task
		for _, board := range boards {
			tasks, err := repository.GetTasksByBoardID(board.ID)
			if err == nil {
				allTasks = append(allTasks, tasks...)
			}
		}

		if err := cache.SetAllTasks(allTasks, cacheExpiration); err != nil {
			log.Printf("Failed to cache all tasks: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(allTasks)
		return
	}

	boardID, err := uuid.Parse(boardIDStr)
	if err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	boardIDStr = boardID.String()
	if cachedData, err := cache.GetTasksByBoardID(boardIDStr); err == nil && cachedData != nil {
		var cachedTasks []models.Task
		if err := json.Unmarshal(cachedData, &cachedTasks); err == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cachedTasks)
			return
		}
	}

	tasks, err := repository.GetTasksByBoardID(boardID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cache.SetTasksByBoardID(boardIDStr, tasks, cacheExpiration); err != nil {
		log.Printf("Failed to cache tasks for board %s: %v", boardIDStr, err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func GetTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	task, err := repository.GetTaskByID(id)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("userID").(uuid.UUID)
	var taskCreatedBy *uuid.UUID
	if ok {
		taskCreatedBy = &userID
	}

	task := &models.Task{
		BoardID:     req.BoardID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		Assignee:    req.Assignee,
		CreatedBy:   taskCreatedBy,
	}

	if task.Status == "" {
		task.Status = "plan"
	}

	if err := repository.CreateTask(task); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cache.InvalidateBoardTasks(task.BoardID.String()); err != nil {
		log.Printf("Failed to invalidate cache for board %s: %v", task.BoardID.String(), err)
	}
	if err := cache.InvalidateAllTasks(); err != nil {
		log.Printf("Failed to invalidate all tasks cache: %v", err)
	}

	BroadcastTaskUpdate(task.BoardID.String(), "task_created", task)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	currentTask, err := repository.GetTaskByID(id)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	var req models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title != nil {
		currentTask.Title = *req.Title
	}
	if req.Description != nil {
		currentTask.Description = *req.Description
	}
	if req.Status != nil {
		currentTask.Status = *req.Status
	}
	if req.Priority != nil {
		currentTask.Priority = req.Priority
	}
	if req.Assignee != nil {
		currentTask.Assignee = req.Assignee
	}

	if err := repository.UpdateTask(currentTask); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cache.InvalidateBoardTasks(currentTask.BoardID.String()); err != nil {
		log.Printf("Failed to invalidate cache for board %s: %v", currentTask.BoardID.String(), err)
	}
	if err := cache.InvalidateAllTasks(); err != nil {
		log.Printf("Failed to invalidate all tasks cache: %v", err)
	}

	BroadcastTaskUpdate(currentTask.BoardID.String(), "task_updated", currentTask)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(currentTask)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	task, err := repository.GetTaskByID(id)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	if err := repository.DeleteTask(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cache.InvalidateBoardTasks(task.BoardID.String()); err != nil {
		log.Printf("Failed to invalidate cache for board %s: %v", task.BoardID.String(), err)
	}
	if err := cache.InvalidateAllTasks(); err != nil {
		log.Printf("Failed to invalidate all tasks cache: %v", err)
	}

	BroadcastTaskUpdate(task.BoardID.String(), "task_deleted", map[string]string{"id": id.String()})

	w.WriteHeader(http.StatusNoContent)
}

func MoveTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := repository.MoveTask(id, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	task, err := repository.GetTaskByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cache.InvalidateBoardTasks(task.BoardID.String()); err != nil {
		log.Printf("Failed to invalidate cache for board %s: %v", task.BoardID.String(), err)
	}
	if err := cache.InvalidateAllTasks(); err != nil {
		log.Printf("Failed to invalidate all tasks cache: %v", err)
	}

	BroadcastTaskUpdate(task.BoardID.String(), "task_moved", task)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

