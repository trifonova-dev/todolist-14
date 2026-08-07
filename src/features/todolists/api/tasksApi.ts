import { instance } from '@/common/instance'
import type { BaseResponse } from '@/common/types'
import type { DomainTask, GetTasksResponse } from './tasksApi.types'

export const tasksApi = {
  getTasks(todolistId: string) {
    return instance.get<GetTasksResponse>(`/todo-lists/${todolistId}/tasks`)
  },
  createTask(payload: { todolistId: string; title: string }) {
    const { todolistId, title } = payload
    return instance.post<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${todolistId}/tasks`, { title })
  },
  updateTask(task: DomainTask) {
    return instance.put<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${task.todoListId}/tasks/${task.id}`, task)
  },
  deleteTask(payload: { todolistId: string; taskId: string }) {
    const { todolistId, taskId } = payload
    return instance.delete<BaseResponse>(`/todo-lists/${todolistId}/tasks/${taskId}`)
  },
}
