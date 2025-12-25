package websocket

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	boardID := vars["board_id"]

	if boardID == "" {
		http.Error(w, "board_id is required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan []byte, 256),
		boardID: boardID,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}
