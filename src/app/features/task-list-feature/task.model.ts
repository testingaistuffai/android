// This file defines the structure of a "Task" object using a TypeScript interface.
// An interface in TypeScript is like a blueprint or a contract that an object must adhere to.
// It specifies the names of the properties an object should have and their types.
// This helps ensure data consistency throughout the application.

export interface Task {
  /**
   * Unique identifier for the task.
   * This is typically a string (e.g., a UUID) to ensure uniqueness, especially if tasks were synced with a server.
   * For this local app, a timestamp-based or simple counter-based ID could also work.
   */
  id: string;

  /**
   * The main description or name of the task.
   * This is what the user sees as the task content.
   */
  title: string;

  /**
   * A boolean flag indicating whether the task has been completed or not.
   * `true` means the task is done, `false` means it's pending.
   */
  isComplete: boolean;
}
