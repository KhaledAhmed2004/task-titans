const TaskStatus = {
  COMPLETED: 'completed',
  ACTIVE: 'active',
  PROGRESSING: 'progressing',
  CANCELLED: 'cancelled',
   ASSIGNED: 'assigned',
} as const;

export { TaskStatus };

// Type helper
type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export type Task = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  taskCategory: string;
  description: string;
  taskImage?: string;
  taskBudget: number;
  taskLocation: string;
  status: TaskStatusType;
  userId: string;
  assignedTo?: string;
};

export type TaskUpdate = {
  title?: string;
  taskCategory?: string;
  description?: string;
  taskImage?: string;
  taskBudget?: number;
  taskLocation?: string;
  dueDate?: string;
  status?: TaskStatusType;
};

export type TaskQuery = {
  userId?: string;
  status?: TaskStatusType;
  taskCategory?: string;
  taskLocation?: string;
  timeRange?: 'recent' | 'weekly' | 'monthly';
};
