"use client"; // This directive marks the component as a Client Component.
// Client Components are necessary for using React hooks (like useState, useEffect)
// and for handling browser events and accessing browser APIs (like localStorage).

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { ApplicationTaskStateService } from '@/app/core-logic/application-task-state.service';
import { TaskCrudOperationsService } from '@/app/core-logic/task-crud-operations.service';
import type { Task } from '@/app/features/task-list-feature/task.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, ListChecks } from 'lucide-react'; // Icons for UI elements
import { useToast } from "@/hooks/use-toast";

// --- Service Instantiation ---
// In a typical Angular app, services are often singletons managed by a dependency injection system.
// For this Next.js/React tutorial page, we are manually instantiating them.
// In a larger React application, you might use the Context API or a state management library (like Zustand, Redux)
// to provide service instances throughout the component tree or manage global state more robustly.

// Create an instance of the state service. This service holds the list of tasks.
const applicationTaskStateService = new ApplicationTaskStateService();
// Create an instance of the CRUD service, passing it the state service instance.
// This is a form of manual dependency injection.
const taskCrudOperationsService = new TaskCrudOperationsService(applicationTaskStateService);

// --- React Component Definition ---
// This is the main UI component for our task list application.
// In the context of the original Ionic/Angular prompt, this single .tsx file
// fulfills the roles of both `home-screen.page.html` (the template/view)
// and `home-screen.page.ts` (the component logic).
export default function HomeScreenPage() {
  // --- Component State ---
  // `tasks` state: Holds the array of tasks to be displayed in the UI.
  // Initialized as an empty array. It will be populated by subscribing to `applicationTaskStateService.tasks$`.
  const [tasks, setTasks] = useState<Task[]>([]);

  // `newTaskTitle` state: Holds the value of the input field for adding a new task.
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  
  // `isLoading` state: Indicates if tasks are currently being loaded from storage.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Access the `toast` function for displaying notifications.
  const { toast } = useToast();

  // --- Effects ---
  // `useEffect` is a React Hook that lets you perform side effects in function components.
  // Common use cases include data fetching, subscriptions, or manually changing the DOM.
  useEffect(() => {
    // This effect runs once after the initial render (due to the empty dependency array `[]`).
    // It's analogous to `ngOnInit` in Angular components.

    // 1. Subscribe to task changes from the ApplicationTaskStateService:
    //    Whenever `tasks$` in the service emits a new value (i.e., the task list changes),
    //    the callback function here will execute, updating the local `tasks` state of this component.
    //    This keeps the UI in sync with the application's task data.
    const subscription = applicationTaskStateService.tasks$.subscribe(currentTasks => {
      setTasks(currentTasks);
      // After the first load (or any update), we are no longer in the initial loading state for display purposes.
      // However, the initial load might still be happening from storage.
    });

    // 2. Load initial tasks from device storage:
    //    This calls the method in our CRUD service to fetch tasks that might have been saved previously.
    //    The `loadAllTasksFromDevice` method itself will update the `tasks$` BehaviorSubject,
    //    which in turn will trigger the subscription above.
    const initializeTasks = async () => {
      setIsLoading(true); // Set loading state before fetching
      await taskCrudOperationsService.loadAllTasksFromDevice();
      setIsLoading(false); // Clear loading state after fetching
    };
    initializeTasks();

    // 3. Cleanup function:
    //    The function returned by `useEffect` is a cleanup function.
    //    It runs when the component is unmounted (e.g., if the user navigates away from this page).
    //    It's crucial to unsubscribe from observables here to prevent memory leaks.
    return () => {
      subscription.unsubscribe();
      console.log('HomeScreenPage unmounted, tasks subscription cleaned up.');
    };
  }, []); // Empty dependency array: effect runs only on mount and cleans up on unmount.

  // --- Event Handlers ---

  /**
   * Handles the submission of the new task form.
   * Prevents the default form submission (which would cause a page reload),
   * calls the CRUD service to create the new task, and clears the input field.
   * @param event - The form submission event.
   */
  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission
    if (!newTaskTitle.trim()) {
      toast({
        title: "Cannot add task",
        description: "Task title cannot be empty.",
        variant: "destructive",
      });
      return; // Don't add if title is empty
    }
    try {
      await taskCrudOperationsService.createNewTask(newTaskTitle);
      setNewTaskTitle(''); // Clear the input field after adding
      toast({
        title: "Task Added",
        description: `"${newTaskTitle}" has been added to your list.`,
      });
    } catch (error) {
       console.error("Error adding task:", error);
       toast({
        title: "Error",
        description: "Could not add the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles changes to the new task input field.
   * Updates the `newTaskTitle` state with the current input value.
   * @param event - The input change event.
   */
  const handleNewTaskTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewTaskTitle(event.target.value);
  };

  /**
   * Handles toggling the completion status of a task.
   * Calls the CRUD service to update the task's status.
   * @param taskId - The ID of the task to toggle.
   * @param currentStatus - The current `isComplete` status of the task.
   */
  const handleToggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      await taskCrudOperationsService.updateTaskStatus(taskId, !currentStatus);
      const task = tasks.find(t => t.id === taskId);
      toast({
        title: `Task ${!currentStatus ? 'Completed' : 'Marked Incomplete'}`,
        description: `"${task?.title}" status updated.`,
      });
    } catch (error) {
      console.error("Error toggling task status:", error);
      toast({
        title: "Error",
        description: "Could not update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles the deletion of a task.
   * Calls the CRUD service to remove the task from the list.
   * @param taskId - The ID of the task to delete.
   * @param taskTitle - The title of the task for the confirmation message.
   */
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    // Optional: Add a confirmation dialog here in a real app.
    // For this tutorial, we'll delete directly.
    try {
      await taskCrudOperationsService.deleteTask(taskId);
      toast({
        title: "Task Deleted",
        description: `"${taskTitle}" has been removed from your list.`,
      });
    } catch (error) {
      console.error("Error deleting task:", error);
       toast({
        title: "Error",
        description: "Could not delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- JSX Rendering ---
  // This is the VDOM (Virtual Document Object Model) structure that React will render to the actual DOM.
  // It uses JSX, which is a syntax extension for JavaScript that looks like HTML.
  // ShadCN UI components are used for styling and pre-built functionality.
  return (
    <div className="flex flex-col items-center min-h-screen p-4 md:p-8 selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ListChecks size={40} className="text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary tracking-tight">
            TaskWise Tutorial
          </CardTitle>
          <p className="text-muted-foreground font-body">
            A simple task list to learn Next.js & app architecture.
          </p>
        </CardHeader>

        <CardContent>
          {/* Form for adding new tasks */}
          <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
            <Input
              type="text"
              placeholder="Enter a new task..."
              value={newTaskTitle}
              onChange={handleNewTaskTitleChange}
              className="flex-grow text-base focus:ring-2 focus:ring-primary/80"
              aria-label="New task title"
            />
            <Button type="submit" variant="default" size="lg" className="shrink-0">
              <PlusCircle size={20} className="mr-2" />
              Add Task
            </Button>
          </form>

          {/* Displaying the list of tasks */}
          {/*
            The `tasks` array (from component state) is mapped to JSX elements.
            Each task object becomes a visual representation in the list.
            The `key={task.id}` prop is crucial for React to efficiently update lists.
            It needs to be a stable, unique identifier for each item.
            
            The `async` pipe in Angular is analogous to directly using the state variable
            that's updated by an observable subscription, as done here with `tasks`.
          */}
          <h2 className="text-xl font-headline text-foreground mb-3 border-b pb-2">My Tasks</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 italic">
              No tasks yet. Add one above to get started!
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-3"> {/* Added pr-3 for scrollbar space */}
              <ul className="space-y-3">
                {tasks.map(task => (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:shadow-md
                                ${task.isComplete ? 'bg-green-100 dark:bg-green-900/50' : 'bg-card'}`}
                    aria-label={`Task: ${task.title}, Status: ${task.isComplete ? 'Completed' : 'Pending'}`}
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.isComplete}
                      onCheckedChange={() => handleToggleTaskComplete(task.id, task.isComplete)}
                      className="h-6 w-6 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      aria-labelledby={`task-title-${task.id}`}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      id={`task-title-${task.id}`}
                      className={`flex-grow cursor-pointer text-base font-body
                                  ${task.isComplete ? 'line-through text-muted-foreground italic' : 'text-foreground'}`}
                    >
                      {task.title}
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="text-destructive hover:bg-destructive/10"
                      aria-label={`Delete task: ${task.title}`}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground justify-center pt-6">
          <p>You have {tasks.filter(t => !t.isComplete).length} pending task(s).</p>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TaskWise Tutorial. Built for learning.</p>
      </footer>
    </div>
  );
}
