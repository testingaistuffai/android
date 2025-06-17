// This service is responsible for managing the application's global state related to tasks.
// Specifically, it holds the current list of tasks and allows other parts of the application
// to subscribe to changes in this list. It acts as the "single source of truth" for tasks.

// RxJS (Reactive Extensions for JavaScript) is a library for reactive programming using Observables,
// to make it easier to compose asynchronous or callback-based code.
import { BehaviorSubject } from 'rxjs';

// Importing the Task model to define the type of data this service will manage.
// This ensures type safety and clarity. This service knows it deals with an array of Task objects.
import type { Task } from '@/app/features/task-list-feature/task.model';

// In a typical Angular application, services are often decorated with `@Injectable()`
// and provided at a certain level (e.g., root). In this Next.js adaptation,
// this class will be instantiated manually where needed (e.g., in the main page component).
export class ApplicationTaskStateService {
  // A BehaviorSubject is a special type of Observable from RxJS.
  // Key characteristics of BehaviorSubject:
  // 1. It needs an initial value upon creation. Here, it's an empty array `[]`, meaning initially there are no tasks.
  // 2. It stores the latest value emitted. When a new subscriber joins, it immediately receives the current value.
  // 3. You can get the current value synchronously using its `getValue()` method.
  //
  // `tasks$` (the `$` suffix is a common convention for Observables) will hold an array of Task objects.
  // It is declared as `private` to encapsulate the state modification within this service (though in this specific service,
  // modifications are handled by `TaskCrudOperationsService`). Other parts of the app will subscribe to it.
  // However, to allow `TaskCrudOperationsService` to update it, we make it public or provide a setter.
  // For this tutorial's structure, `TaskCrudOperationsService` will directly call `next()` on this BehaviorSubject.
  public tasks$: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);

  constructor() {
    // This constructor is currently empty. In a more complex scenario,
    // it might initialize some default state or perform other setup tasks.
    // For example, one might consider loading initial tasks from storage here,
    // but that responsibility is given to `TaskCrudOperationsService` in this design.
    console.log('ApplicationTaskStateService initialized. Current tasks:', this.tasks$.getValue());
  }

  // This service itself does not contain methods to *change* the tasks (like add, delete, update).
  // Its sole responsibility is to *hold* the state and *broadcast* changes to that state.
  // The logic for modifying tasks resides in `TaskCrudOperationsService.ts`, which will then
  // update this `tasks$` BehaviorSubject. This separation of concerns makes the state management clearer:
  // - ApplicationTaskStateService: The "what" (the current state).
  // - TaskCrudOperationsService: The "how" (the logic to change the state).
}
