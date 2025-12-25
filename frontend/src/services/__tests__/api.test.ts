import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { boardsAPI, tasksAPI, columnsAPI } from '../api'
import type { Board, Task, Column } from '../api'

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('boardsAPI', () => {
    it('should fetch all boards', async () => {
      const mockBoards: Board[] = [
        {
          id: '1',
          name: 'Test Board 1',
          description: 'Description 1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Test Board 2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBoards,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      const result = await boardsAPI.getAll()

      expect(result).toEqual(mockBoards)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/boards')
    })

    it('should fetch board by id', async () => {
      const mockBoard: Board = {
        id: '1',
        name: 'Test Board',
        description: 'Test Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBoard,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      const result = await boardsAPI.getById('1')

      expect(result).toEqual(mockBoard)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/boards/1')
    })

    it('should throw error when fetch fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      await expect(boardsAPI.getAll()).rejects.toThrow('Failed to fetch boards')
    })
  })

  describe('tasksAPI', () => {
    it('should fetch all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          board_id: 'board-1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'plan',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          board_id: 'board-1',
          title: 'Task 2',
          description: 'Description 2',
          status: 'development',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      const result = await tasksAPI.getAll()

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/tasks')
    })

    it('should fetch tasks by board_id', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          board_id: 'board-1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'plan',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      const result = await tasksAPI.getAll('board-1')

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/tasks?board_id=board-1')
    })

    it('should throw error when fetch fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      await expect(tasksAPI.getAll()).rejects.toThrow('Failed to fetch tasks')
    })
  })

  describe('columnsAPI', () => {
    it('should fetch columns by board_id', async () => {
      const mockColumns: Column[] = [
        {
          id: '1',
          board_id: 'board-1',
          title: 'Plan',
          status_id: 'plan',
          position: 0,
        },
        {
          id: '2',
          board_id: 'board-1',
          title: 'Development',
          status_id: 'development',
          position: 1,
        },
      ]

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockColumns,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      const result = await columnsAPI.getByBoardId('board-1')

      expect(result).toEqual(mockColumns)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/columns?board_id=board-1')
    })

    it('should throw error when fetch fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)
      vi.stubGlobal('fetch', mockFetch)

      await expect(columnsAPI.getByBoardId('board-1')).rejects.toThrow('Failed to fetch columns')
    })
  })
})

