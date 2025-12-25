package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type Hub struct {
	clients    map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
	mu         sync.RWMutex
}

type Message struct {
	Type    string      `json:"type"`
	BoardID string      `json:"board_id,omitempty"`
	Data    interface{} `json:"data"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.boardID] == nil {
				h.clients[client.boardID] = make(map[*Client]bool)
			}
			h.clients[client.boardID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered for board %s. Total clients: %d", client.boardID, len(h.clients[client.boardID]))

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.boardID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.clients, client.boardID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered for board %s. Total clients: %d", client.boardID, len(h.clients[client.boardID]))

		case message := <-h.broadcast:
			h.mu.RLock()
			clients, ok := h.clients[message.BoardID]
			if !ok {
				h.mu.RUnlock()
				continue
			}
			data, err := json.Marshal(message)
			if err != nil {
				log.Printf("Error marshaling message: %v", err)
				h.mu.RUnlock()
				continue
			}
			for client := range clients {
				select {
				case client.send <- data:
				default:
					close(client.send)
					delete(clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Broadcast(boardID string, messageType string, data interface{}) {
	message := &Message{
		Type:    messageType,
		BoardID: boardID,
		Data:    data,
	}
	select {
	case h.broadcast <- message:
	default:
		log.Printf("Broadcast channel full, dropping message")
	}
}
