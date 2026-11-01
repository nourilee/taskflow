import type {
  CreateTaskInput,
  ListTasksQuery,
  Task,
  TaskStatus,
  TaskSummary,
  UpdateTaskInput,
} from '@taskflow/shared';

export interface TaskListResult {
  items: Task[];
  total: number;
  summary: TaskSummary;
}

export interface TaskRepository {
  list(query: ListTasksQuery): Promise<TaskListResult>;
  findById(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task | null>;
  updateStatus(id: string, status: TaskStatus): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  ping(): Promise<void>;
}
