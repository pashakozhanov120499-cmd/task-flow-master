const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const getToken = (): string | null => {
  return localStorage.getItem('token')
}

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface Task {
  id: string
  board_id: string
  title: string
  description: string
  status: string
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface Column {
  id: string
  board_id: string
  title: string
  status_id: string
  position: number
}

// API для досок
export const boardsAPI = {
  getAll: async (): Promise<Board[]> => {
    const response = await fetch(`${API_BASE_URL}/boards`)
    if (!response.ok) throw new Error('Failed to fetch boards')
    return response.json()
  },

  getById: async (id: string): Promise<Board> => {
    const response = await fetch(`${API_BASE_URL}/boards/${id}`)
    if (!response.ok) throw new Error('Failed to fetch board')
    return response.json()
  },

  create: async (board: { name: string; description?: string }): Promise<Board> => {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(board),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create board: ${response.status} ${errorText}`)
    }
    return response.json()
  },

  update: async (id: string, board: { name: string; description?: string }): Promise<Board> => {
    const response = await fetch(`${API_BASE_URL}/boards/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(board),
    })
    if (!response.ok) throw new Error('Failed to update board')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/boards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete board')
  },
}

// API для задач
export const tasksAPI = {
  getAll: async (boardId?: string): Promise<Task[]> => {
    const url = boardId 
      ? `${API_BASE_URL}/tasks?board_id=${boardId}`
      : `${API_BASE_URL}/tasks`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  getById: async (id: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`)
    if (!response.ok) throw new Error('Failed to fetch task')
    return response.json()
  },

  create: async (task: {
    board_id: string
    title: string
    description: string
    status?: string
    priority?: 'low' | 'medium' | 'high'
    assignee?: string
  }): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(task),
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  update: async (id: string, updates: {
    title?: string
    description?: string
    status?: string
    priority?: 'low' | 'medium' | 'high'
    assignee?: string
  }): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete task')
  },

  move: async (id: string, status: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/move`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Failed to move task')
    return response.json()
  },
}

// API для колонок
export const columnsAPI = {
  getByBoardId: async (boardId: string): Promise<Column[]> => {
    const response = await fetch(`${API_BASE_URL}/columns?board_id=${boardId}`)
    if (!response.ok) throw new Error('Failed to fetch columns')
    return response.json()
  },

  create: async (column: {
    board_id: string
    title: string
    status_id: string
    position: number
  }): Promise<Column> => {
    const response = await fetch(`${API_BASE_URL}/columns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(column),
    })
    if (!response.ok) throw new Error('Failed to create column')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/columns/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete column')
  },
}

// API для авторизации
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to login')
    }
    return response.json()
  },

  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to register')
    }
    return response.json()
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to get current user')
    return response.json()
  },
}
