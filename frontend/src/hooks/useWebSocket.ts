import { useEffect, useRef } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { wsTaskCreated, wsTaskUpdated, wsTaskMoved, wsTaskDeleted, fetchBoard, convertAPITask } from '@/store/slices/boardsSlice'
import type { Task as APITask } from '@/services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface WebSocketMessage {
  type: string
  board_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export function useWebSocket(boardId: string | null) {
  const dispatch = useAppDispatch()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!boardId) return

    const connect = () => {
      if (wsRef.current) {
        wsRef.current.close()
      }

      const wsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')
      const ws = new WebSocket(`${wsUrl}/ws/board/${boardId}`)

      ws.onopen = () => {
        console.log('WebSocket connected for board:', boardId)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'task_created':
              if (message.data) {
                const task = convertAPITask(message.data as APITask)
                dispatch(wsTaskCreated({ boardId: message.board_id, task }))
                dispatch(fetchBoard(message.board_id))
              }
              break
            case 'task_updated':
              if (message.data) {
                const task = convertAPITask(message.data as APITask)
                dispatch(wsTaskUpdated({ boardId: message.board_id, task }))
                dispatch(fetchBoard(message.board_id))
              }
              break
            case 'task_moved':
              if (message.data) {
                const task = convertAPITask(message.data as APITask)
                dispatch(wsTaskMoved({ boardId: message.board_id, task }))
                dispatch(fetchBoard(message.board_id))
              }
              break
            case 'task_deleted':
              if (message.data?.id) {
                dispatch(wsTaskDeleted({ boardId: message.board_id, taskId: message.data.id }))
                dispatch(fetchBoard(message.board_id))
              }
              break
            default:
              console.log('Unknown WebSocket message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected for board:', boardId)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current = ws
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [boardId, dispatch])
}

