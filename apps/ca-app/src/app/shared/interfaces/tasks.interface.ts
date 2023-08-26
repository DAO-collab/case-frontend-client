export interface ISubtaskInterface {
  duration?: {
    due_date?: string
  },
  name: string,
  participants_ids?: string[],
  status?: TaskStatus
}

export enum TaskStatus {
  ToDo = 'todo',
  InProgress = 'inprogress',
  Done = 'done'
}
