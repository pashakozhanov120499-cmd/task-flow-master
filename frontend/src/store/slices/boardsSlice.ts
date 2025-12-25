import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { boardsAPI, tasksAPI, type Board as APIBoard, type Task as APITask } from '@/services/api'

export type Task = {
  id: string
  title: string
  description: string
  status: string
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
}

export type Board = {
  id: string
  name: string
  description?: string
  tasks: Task[]
}

export const convertAPITask = (task: APITask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assignee: task.assignee,
})

const convertAPIBoard = (board: APIBoard): Board => ({
  id: board.id,
  name: board.name,
  description: board.description,
  tasks: (board.tasks || []).map(convertAPITask),
})

interface BoardsState {
  boards: Board[]
  currentBoardId: string | null
}

interface BoardsState {
  boards: Board[]
  currentBoardId: string | null
  loading: boolean
  error: string | null
}

const initialState: BoardsState = {
  boards: [],
  currentBoardId: null,
  loading: false,
  error: null,
}

export const fetchBoards = createAsyncThunk('boards/fetchBoards', async () => {
  const boards = await boardsAPI.getAll()
  return boards.map(convertAPIBoard)
})

export const fetchBoard = createAsyncThunk('boards/fetchBoard', async (id: string) => {
  const board = await boardsAPI.getById(id)
  return convertAPIBoard(board)
})

export const createBoard = createAsyncThunk('boards/createBoard', async (board: { name: string; description?: string }) => {
  const newBoard = await boardsAPI.create(board)
  return convertAPIBoard(newBoard)
})

export const createTask = createAsyncThunk('boards/createTask', async (params: {
  boardId: string
  task: Omit<Task, 'id'>
}) => {
  const newTask = await tasksAPI.create({
    board_id: params.boardId,
    title: params.task.title,
    description: params.task.description,
    status: params.task.status || 'plan',
    priority: params.task.priority,
    assignee: params.task.assignee,
  })
  return { boardId: params.boardId, task: convertAPITask(newTask) }
})

export const updateTask = createAsyncThunk('boards/updateTask', async (params: {
  boardId: string
  taskId: string
  updates: Partial<Task>
}) => {
  const updatedTask = await tasksAPI.update(params.taskId, {
    title: params.updates.title,
    description: params.updates.description,
    status: params.updates.status,
    priority: params.updates.priority,
    assignee: params.updates.assignee,
  })
  return { boardId: params.boardId, task: convertAPITask(updatedTask) }
})

export const moveTask = createAsyncThunk('boards/moveTask', async (params: {
  taskId: string
  newStatus: string
  boardId: string
}) => {
  const updatedTask = await tasksAPI.move(params.taskId, params.newStatus)
  return { boardId: params.boardId, task: convertAPITask(updatedTask) }
})

export const deleteBoard = createAsyncThunk('boards/deleteBoard', async (id: string) => {
  await boardsAPI.delete(id)
  return id
})

export const deleteTask = createAsyncThunk('boards/deleteTask', async (params: {
  taskId: string
  boardId: string
}) => {
  await tasksAPI.delete(params.taskId)
  return params
})

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    setCurrentBoard: (state, action: PayloadAction<string>) => {
      state.currentBoardId = action.payload
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addColumn: (_state, _action: PayloadAction<{ boardId: string; columnId: string; columnTitle: string }>) => {
    },
    wsTaskCreated: (state, action: PayloadAction<{ boardId: string; task: Task }>) => {
      const board = state.boards.find(b => b.id === action.payload.boardId)
      if (board) {
        const existingTaskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
        if (existingTaskIndex >= 0) {
          board.tasks[existingTaskIndex] = action.payload.task
        } else {
          board.tasks.push(action.payload.task)
        }
      }
    },
    wsTaskUpdated: (state, action: PayloadAction<{ boardId: string; task: Task }>) => {
      const board = state.boards.find(b => b.id === action.payload.boardId)
      if (board) {
        const taskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
        if (taskIndex >= 0) {
          board.tasks[taskIndex] = action.payload.task
        }
      }
    },
    wsTaskMoved: (state, action: PayloadAction<{ boardId: string; task: Task }>) => {
      const board = state.boards.find(b => b.id === action.payload.boardId)
      if (board) {
        const taskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
        if (taskIndex >= 0) {
          board.tasks[taskIndex] = action.payload.task
        }
      }
    },
    wsTaskDeleted: (state, action: PayloadAction<{ boardId: string; taskId: string }>) => {
      const board = state.boards.find(b => b.id === action.payload.boardId)
      if (board) {
        board.tasks = board.tasks.filter(t => t.id !== action.payload.taskId)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false
        state.boards = action.payload
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch boards'
      })
    builder
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.loading = false
        const index = state.boards.findIndex(b => b.id === action.payload.id)
        if (index >= 0) {
          state.boards[index] = action.payload
        } else {
          state.boards.push(action.payload)
        }
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch board'
      })
    builder
      .addCase(createBoard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false
        state.boards.push(action.payload)
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create board'
      })
    builder
      .addCase(createTask.fulfilled, (state, action) => {
        const board = state.boards.find(b => b.id === action.payload.boardId)
        if (board) {
          const existingTaskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
          if (existingTaskIndex >= 0) {
            board.tasks[existingTaskIndex] = action.payload.task
          } else {
            board.tasks.push(action.payload.task)
          }
        }
      })
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const board = state.boards.find(b => b.id === action.payload.boardId)
        if (board) {
          const taskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
          if (taskIndex >= 0) {
            board.tasks[taskIndex] = action.payload.task
          }
        }
      })
    builder
      .addCase(moveTask.fulfilled, (state, action) => {
        const board = state.boards.find(b => b.id === action.payload.boardId)
        if (board) {
          const taskIndex = board.tasks.findIndex(t => t.id === action.payload.task.id)
          if (taskIndex >= 0) {
            board.tasks[taskIndex] = action.payload.task
          }
        }
      })
    builder
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter(b => b.id !== action.payload)
        if (state.currentBoardId === action.payload) {
          state.currentBoardId = null
        }
      })
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        const board = state.boards.find(b => b.id === action.payload.boardId)
        if (board) {
          board.tasks = board.tasks.filter(t => t.id !== action.payload.taskId)
        }
      })
  },
})

export const { setCurrentBoard, addColumn, wsTaskCreated, wsTaskUpdated, wsTaskMoved, wsTaskDeleted } = boardsSlice.actions
export default boardsSlice.reducer

