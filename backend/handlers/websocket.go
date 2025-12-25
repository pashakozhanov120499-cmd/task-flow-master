package handlers

import "task-flow-backend/websocket"

var wsHub *websocket.Hub

func SetWebSocketHub(hub *websocket.Hub) {
	wsHub = hub
}

func BroadcastTaskUpdate(boardID string, eventType string, task interface{}) {
	if wsHub != nil {
		wsHub.Broadcast(boardID, eventType, task)
	}
}

func BroadcastBoardUpdate(boardID string, eventType string, board interface{}) {
	if wsHub != nil {
		wsHub.Broadcast(boardID, eventType, board)
	}
}

func BroadcastColumnUpdate(boardID string, eventType string, column interface{}) {
	if wsHub != nil {
		wsHub.Broadcast(boardID, eventType, column)
	}
}
