import { TodosAccess } from '../dataLayer/todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { parseUserId } from '../auth/utils'
// import * as createError from 'http-errors'

const todosAccess = new TodosAccess()

export async function getTodosForUser(jwtToken: string): Promise<TodoItem[]> {
    const userId = parseUserId(jwtToken)

    return todosAccess.getTodosForUser(userId)
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    jwtToken: string
  ): Promise<TodoItem> {
  
    const todoId = uuid.v4()
    const userId = parseUserId(jwtToken)
  
    return await todosAccess.createTodo({
        todoId: todoId,
        userId: userId,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        createdAt: new Date().toISOString(),
        done: false
    })
}

export async function updateTodo(
    updateTodoRequest: UpdateTodoRequest,
    todoId: string,
    jwtToken: string
  ): Promise<UpdateTodoRequest> {
  
    const userId = parseUserId(jwtToken)
  
    return await todosAccess.updateTodo(
        updateTodoRequest,
        todoId,
        userId
    )
}

export async function deleteTodo(
    todoId: string,
    jwtToken: string
  ) {
  
    const userId = parseUserId(jwtToken)
  
    return await todosAccess.deleteTodo(
        todoId,
        userId
    )
}

export async function updateTodoUrl(
    todoId: string,
    jwtToken: string,
    attachmentUrl: string
  ) {
  
    const userId = parseUserId(jwtToken)
  
    return await todosAccess.updateTodoUrl({
        todoId: todoId,
        userId: userId,
        attachmentUrl: attachmentUrl
    })
}
