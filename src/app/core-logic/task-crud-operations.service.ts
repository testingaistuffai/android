// This service is responsible for all Create, Read, Update, and Delete (CRUD) operations for tasks.
// It encapsulates the business logic for managing the task list.
// It communicates with ApplicationTaskStateService to update the global task state
// and also handles persistence (saving/loading tasks to/from device storage).

import type { Task } from '@/app/features/task-list-feature/task.model';
import { ApplicationTaskStateService } from './application-task-state.service';

// The key used to store tasks in localStorage.
// Using a constant helps avoid typos and makes it easy to change if needed.
const TASKS_STORAGE_KEY = 'tutorialAppTasks';

export class TaskCrudOperationsService {
  // This demonstrates a form of Dependency Injection.
  // The `TaskCrudOperationsService` *depends on* the `ApplicationTaskStateService`
  // to get the current state and to notify it of changes.
  // By injecting it via the constructor, we make this dependency explicit and allow for
  // easier testing and flexibility (e.g., providing a mock service for tests).
  private applicationTaskStateService: ApplicationTaskStateService;

  constructor(applicationTaskStateService: ApplicationTaskStateService) {
    this.applicationTaskStateService = applicationTaskStateService;
    console.log('TaskCrudOperationsService initialized.');
    // Initial loading of tasks is typically triggered by the UI layer (e.g., page component's useEffect).
  }

  /**
   * Loads all tasks from the device's persistent storage.
   * This method is typically called once when the application starts or the relevant UI component mounts.
   * It updates the ApplicationTaskStateService with the loaded tasks.
   *
   * Note on Asynchronicity: Loading from storage can be an asynchronous operation.
   * While localStorage is synchronous, this method is designed as async to align with
   * typical storage patterns (like Capacitor Preferences or IndexedDB) which are async.
   */
  public async loadAllTasksFromDevice(): Promise<void> {
    console.log('Attempting to load tasks from device storage...');
    try {
      const tasks = await this._loadTasksFromDevice();
      // Update the central task state with the tasks loaded from storage.
      // The `next()` method on a BehaviorSubject emits a new value to all its subscribers.
      this.applicationTaskStateService.tasks$.next(tasks);
      console.log('Tasks loaded successfully from device storage:', tasks);
    } catch (error) {
      console.error('Failed to load tasks from device storage:', error);
      // In a real app, you might want to inform the user or fall back to an empty list.
      // For simplicity, we'll just proceed with an empty list if loading fails.
      this.applicationTaskStateService.tasks$.next([]);
    }
  }

  /**
   * Creates a new task with the given title.
   * The new task is added to the current list of tasks, the state is updated,
   * and the entire list is saved to device storage.
   * @param title - The title/description of the new task.
   */
  public async createNewTask(title: string): Promise<void> {
    if (!title || title.trim() === '') {
      console.warn('Cannot create task with empty title.');
      // Optionally, throw an error or notify the user.
      return;
    }

    const newTask: Task = {
      // Generates a simple unique ID. In a real app, UUIDs are preferred.
      // Using Date.now() combined with a random number for basic uniqueness here.
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      isComplete: false, // New tasks are initially incomplete.
    };

    console.log('Creating new task:', newTask);

    // Get the current list of tasks from the state service.
    const currentTasks = this.applicationTaskStateService.tasks$.getValue();
    // Create a new array with the new task added.
    // It's important to create a new array instance for reactive updates to work correctly.
    const updatedTasks = [...currentTasks, newTask];

    // Update the central task state.
    this.applicationTaskStateService.tasks$.next(updatedTasks);
    // Persist the updated list of tasks.
    await this._saveTasksToDevice(updatedTasks);
    console.log('New task created and list saved. Current tasks:', updatedTasks);
  }

  /**
   * Updates the completion status of an existing task.
   * Finds the task by its ID, updates its `isComplete` status,
   * updates the state, and saves the changes to device storage.
   * @param taskId - The ID of the task to update.
   * @param isComplete - The new completion status for the task.
   */
  public async updateTaskStatus(taskId: string, isComplete: boolean): Promise<void> {
    console.log(`Updating task status for ID: ${taskId} to isComplete: ${isComplete}`);
    const currentTasks = this.applicationTaskStateService.tasks$.getValue();
    // Find the task and update it.
    // `map` creates a new array, which is good for immutability.
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, isComplete: isComplete } : task
    );

    // Check if any task was actually updated to prevent unnecessary saves if ID not found.
    if (JSON.stringify(currentTasks) !== JSON.stringify(updatedTasks)) {
      this.applicationTaskStateService.tasks$.next(updatedTasks);
      await this._saveTasksToDevice(updatedTasks);
      console.log('Task status updated and list saved. Current tasks:', updatedTasks);
    } else {
      console.warn(`Task with ID: ${taskId} not found for updating status.`);
    }
  }

  /**
   * Deletes a task from the list.
   * Filters out the task with the given ID, updates the state,
   * and saves the modified list to device storage.
   * @param taskId - The ID of the task to delete.
   */
  public async deleteTask(taskId: string): Promise<void> {
    console.log(`Deleting task with ID: ${taskId}`);
    const currentTasks = this.applicationTaskStateService.tasks$.getValue();
    // Create a new array excluding the task to be deleted.
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);

    // Check if any task was actually deleted.
    if (currentTasks.length !== updatedTasks.length) {
      this.applicationTaskStateService.tasks$.next(updatedTasks);
      await this._saveTasksToDevice(updatedTasks);
      console.log('Task deleted and list saved. Current tasks:', updatedTasks);
    } else {
      console.warn(`Task with ID: ${taskId} not found for deletion.`);
    }
  }

  // --- Private Helper Methods for Persistence ---

  /**
   * Saves the current list of tasks to the device's persistent storage (localStorage).
   * This method is private as it's an internal implementation detail of this service.
   * The UI or other services don't need to know how tasks are saved.
   * @param tasks - The array of tasks to save.
   *
   * Note on localStorage: It's a synchronous API, but wrapped in Promise here for consistency
   * with potential async storage mechanisms (like Capacitor Preferences). It can only store strings,
   * so objects must be serialized (e.g., using JSON.stringify).
   */
  private async _saveTasksToDevice(tasks: Task[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure this code only runs on the client-side where localStorage is available.
        if (typeof window !== 'undefined' && window.localStorage) {
          const tasksJson = JSON.stringify(tasks);
          window.localStorage.setItem(TASKS_STORAGE_KEY, tasksJson);
          console.log('Tasks saved to localStorage:', tasks);
          resolve();
        } else {
          console.warn('localStorage is not available. Tasks cannot be saved.');
          // Resolve anyway for graceful degradation, or reject if saving is critical.
          resolve();
        }
      } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
        reject(error);
      }
    });
  }

  /**
   * Loads tasks from the device's persistent storage (localStorage).
   * This method is private.
   * @returns A Promise that resolves with an array of Task objects.
   * If no tasks are found or an error occurs, it resolves with an empty array.
   */
  private async _loadTasksFromDevice(): Promise<Task[]> {
    return new Promise((resolve) => {
      try {
        // Ensure this code only runs on the client-side.
        if (typeof window !== 'undefined' && window.localStorage) {
          const tasksJson = window.localStorage.getItem(TASKS_STORAGE_KEY);
          if (tasksJson) {
            const loadedTasks: Task[] = JSON.parse(tasksJson);
            console.log('Tasks retrieved from localStorage:', loadedTasks);
            resolve(loadedTasks);
            return;
          } else {
            console.log('No tasks found in localStorage.');
            resolve([]); // No tasks found, return empty array.
            return;
          }
        } else {
          console.warn('localStorage is not available. Cannot load tasks.');
          resolve([]); // localStorage not available, return empty array.
          return;
        }
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        resolve([]); // Return empty array on error to prevent app crash.
        return;
      }
    });
  }
}
