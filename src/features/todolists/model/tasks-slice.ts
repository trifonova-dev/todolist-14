import { createTodolistTC, deleteTodolistTC } from './todolists-slice'
import { createAppSlice } from '@/common/utils'
import { tasksApi } from '@/features/todolists/api/tasksApi'
import type { DomainTask, UpdateTaskModel } from '@/features/todolists/api/tasksApi.types'
import { setAppStatusAC } from '@/app/app-slice'
import type { RootState } from '@/app/store'

export const tasksSlice = createAppSlice({
  name: 'tasks',
  initialState: {} as TasksState,
  selectors: {
    selectTasks: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTodolistTC.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(deleteTodolistTC.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
  },
  reducers: (create) => ({
    fetchTasksTC: create.asyncThunk(
      async (todolistId: string, thunkAPI) => {
        try {
          thunkAPI.dispatch(setAppStatusAC({ status: 'loading' }))
          const res = await tasksApi.getTasks(todolistId)
          thunkAPI.dispatch(setAppStatusAC({ status: 'succeeded' }))
          return { todolistId, tasks: res.data.items }
        } catch {
          thunkAPI.dispatch(setAppStatusAC({ status: 'failed' }))
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          if (action.payload) state[action.payload.todolistId] = action.payload.tasks
        },
      }
    ),
    createTaskTC: create.asyncThunk(
      async (arg: { todolistId: string; title: string }, thunkAPI) => {
        try {
          thunkAPI.dispatch(setAppStatusAC({ status: 'loading' }))
          const res = await tasksApi.createTask(arg)
          thunkAPI.dispatch(setAppStatusAC({ status: 'succeeded' }))
          return { task: res.data.data.item }
        } catch {
          thunkAPI.dispatch(setAppStatusAC({ status: 'failed' }))
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          state[action.payload.task.todoListId].unshift(action.payload.task)
        },
      }
    ),
    deleteTaskTC: create.asyncThunk(
      async (arg: { taskId: string; todolistId: string }, thunkAPI) => {
        try {
          await tasksApi.deleteTask(arg)
          return arg
        } catch {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const tasks = state[action.payload.todolistId]
          const index = tasks.findIndex((task) => task.id === action.payload.taskId)
          if (index !== -1) {
            tasks.splice(index, 1)
          }
        },
      }
    ),
    changeTaskStatusTC: create.asyncThunk(
      async (task: DomainTask, { rejectWithValue, dispatch }) => {
        try {
          dispatch(setAppStatusAC({ status: 'loading' }))
          const res = await tasksApi.updateTask(task)
          // console.log('🔵 Ответ сервера:', res.data.data.item)
          dispatch(setAppStatusAC({ status: 'succeeded' }))
          return { task: res.data.data.item }
        } catch (e) {
          dispatch(setAppStatusAC({ status: 'failed' }))
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const updatedTask = action.payload.task
          const task = state[updatedTask.todoListId].find((t) => t.id === updatedTask.id)
          if (task) {
            task.status = updatedTask.status
          }
        },
      }
    ),
    changeTaskTitleTC: create.asyncThunk(
      async (task: DomainTask, { rejectWithValue }) => {
        try {
          const res = await tasksApi.updateTask(task)
          return { task: res.data.data.item }
        } catch (e) {
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const updatedTask = action.payload.task
          const task = state[updatedTask.todoListId].find((t) => t.id === updatedTask.id)
          if (task) {
            task.title = updatedTask.title
          }
        },
      }
    ),
    updateTaskTC: create.asyncThunk(
      async (
        arg: { todolistId: string; taskId: string; domainModel: Partial<UpdateTaskModel> },
        { dispatch, rejectWithValue, getState }
      ) => {
        try {
          const state = getState() as RootState
          const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId)
          if (!task) return rejectWithValue(null)

          const domainModel: Partial<UpdateTaskModel> = {
            description: arg.domainModel.description ?? task.description,
            title: arg.domainModel.title ?? task.title,
            status: arg.domainModel.status ?? task.status,
            priority: arg.domainModel.priority ?? task.priority,
            startDate: arg.domainModel.startDate ?? task.startDate,
            deadline: arg.domainModel.deadline ?? task.deadline,
          }
          const res = await tasksApi.updateTask({ todoListId: arg.todolistId, taskId: arg.taskId, domainModel })
          return { todolistId: arg.todolistId, task: res.data.data.item }
        } catch (e) {
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const tasks = state[action.payload.todolistId]
          const task = tasks.find((t) => t.id === )
        },
      }
    ),
  }),
})

export const { selectTasks } = tasksSlice.selectors
export const { deleteTaskTC, createTaskTC, changeTaskStatusTC, changeTaskTitleTC, fetchTasksTC, updateTaskTC } =
  tasksSlice.actions
export const tasksReducer = tasksSlice.reducer

export type TasksState = Record<string, DomainTask[]>
