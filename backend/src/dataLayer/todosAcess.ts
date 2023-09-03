import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const logger = createLogger('TodosAccess')

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todos')

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()
      
        return todoItem
    }

    async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                'todoId': todoId,
                'userId': userId
            },
            UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
            ExpressionAttributeValues: {
                ':n': todoUpdate.name,
                ':d': todoUpdate.dueDate,
                ':done': todoUpdate.done
            },
            ExpressionAttributeNames: {
                "#namefield": "name"
            }
        }).promise()
      
        return todoUpdate
    }

    async deleteTodo(todoId: string, userId: string) {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                'todoId': todoId,
                'userId': userId
            }
        }).promise()

        await this.deleteTodoObject(todoId)
    }

    async updateTodoUrl(updatedTodo: any): Promise<TodoItem> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { 
                todoId: updatedTodo.todoId, 
                userId: updatedTodo.userId },
            ExpressionAttributeNames: {"#A": "attachmentUrl"},
            UpdateExpression: "set #A = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": updatedTodo.attachmentUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()
          
        return updatedTodo 
    }

    async removeTodoUrl(updatedTodo: any): Promise<TodoItem> {
        logger.info('Removing url with todoId: ' + updatedTodo.todoId)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: { 
                todoId: updatedTodo.todoId, 
                userId: updatedTodo.userId },
            ExpressionAttributeNames: {"#A": "attachmentUrl"},
            UpdateExpression: "remove #A",
            ReturnValues: "UPDATED_NEW"
        }).promise()

        return updatedTodo
    }

    async deleteTodoObject(todoId: string){
        const params = {
            Bucket: bucketName, 
            Key: todoId
        }

        await s3.deleteObject(params).promise();
    }
}