# MANIFEST: TaskWise Tutorial App (Next.js Adaptation)

This document provides a high-level overview of the application's architecture, adapted for a Next.js learning context. It is updated as new features are added. The goal is to illustrate common architectural patterns (like services and state management) in a way that's understandable, even though the underlying framework (Next.js/React) differs from the original Ionic/Angular prompt.

## Phase 1: Project Foundation

### Core Folders (Conceptual Mapping)

*   `src/app/core-logic/`: Holds the "brains" of the app. Services here manage the application's data and state. In a Next.js app, these might be custom hooks, context providers, or simple TypeScript classes as used in this tutorial.
*   `src/app/features/`: Contains folders for each major feature. In Next.js, features are often co-located with their routes, but for this tutorial, we're separating data models to illustrate a feature-based organization.
*   `src/app/shared-components/`: For reusable UI components. In Next.js, these are standard React components, often placed in a `components/` directory. This folder is created for structural similarity to the prompt.

### Data Models

*   `src/app/features/task-list-feature/task.model.ts`: Defines the TypeScript `interface` for a `Task` object. This is the blueprint for our data.

## Phase 2: Core Logic Services

These services are located in `src/app/core-logic/`. In this Next.js adaptation, they are TypeScript classes instantiated by the UI layer.

*   `application-task-state.service.ts`:
    *   **Responsibility:** Acts as the central "store" for the task list. It doesn't contain any logic for changing data itself.
    *   **Key Technology:** Uses an RxJS `BehaviorSubject` to hold the `Task[]` array and notify any part of the app (in this case, our main page component) when the list changes. This demonstrates a reactive way to manage state.
*   `task-crud-operations.service.ts`:
    *   **Responsibility:** Provides all the methods to Create, Read, Update, and Delete tasks (CRUD). It gets its data from, and sends its updates to, the `application-task-state.service`.
    *   **Key Technology:** Uses a form of "manual" Dependency Injection (passing an instance of `ApplicationTaskStateService` to its constructor) to communicate with the state service.

## Phase 3: User Interface

*   `src/app/page.tsx` (acting as the Home Screen for this tutorial):
    *   **Responsibility:** This is the main screen the user sees. It displays the list of tasks and allows the user to add, complete, and delete them.
    *   **Implementation:** This Next.js page component (specifically, a Client Component due to its interactivity and use of hooks/state) combines the visual layout (JSX) and the presentation logic (TypeScript functions and React hooks). It doesn't contain the core business logic itself; instead, it calls the appropriate methods from `task-crud-operations.service.ts` in response to user actions (like button clicks). It gets the data to display by subscribing to the `tasks$` observable from `application-task-state.service.ts`.
    *   **Note on HTML/TS separation:** In frameworks like Angular, templates (HTML) and component logic (TS) are often in separate files. In React (and thus Next.js), JSX allows embedding HTML-like syntax directly within JavaScript/TypeScript, leading to a single `.tsx` file for both view and related logic.

## Phase 4: Data Persistence

*   **Responsibility:** To save the user's task list so it's not lost when the app closes.
*   **Key Technology:** Uses the browser's `localStorage` API. This is a common client-side storage mechanism and serves as an analogue to `@capacitor/preferences` for this web-based Next.js tutorial.
*   **Location of Logic:** The saving and loading logic is encapsulated entirely within `task-crud-operations.service.ts` (specifically in its private `_saveTasksToDevice` and `_loadTasksFromDevice` methods, and called by public CRUD methods). The UI (`src/app/page.tsx`) has no direct knowledge of how or where the data is saved; it only knows how to request actions (e.g., "add task," "load tasks").
