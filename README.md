# todotxt4js

A comprehensive TypeScript implementation of the todo.txt format specification. This library provides robust parsing, querying, and management of todo.txt tasks with additional functionality like recurrence patterns, due dates, and metadata handling.

## Features

- Robust Parsing: Parse tasks with completion markers, priorities, dates, projects, contexts, and key-value pairs
- Task Management: Create, edit, delete, and query tasks with a fluent API
- Metadata Support: Work with projects, contexts, priorities, and custom key-value pairs
- Date Handling: Due dates, overdue detection, days-until-due calculations
- Recurrence Patterns: Support for recurring tasks (daily, weekly, monthly, yearly)
- Filtering & Sorting: Filter by multiple criteria and sort by different properties
- Customizable Behavior: Configure duplicate key handling and register custom key handlers for validation/transformation
- Full TypeScript Support: Strong typing for improved development experience

## Installation

Install via npm:

```bash
npm install todotxt4js
```

Or clone the repository directly:

```bash
git clone https://github.com/tobias0409/todotxt4js.git
cd todotxt4js
npm install
```

## Usage

### Basic Example

```ts
import { TodoList, Task } from "todotxt4js";

// Create a new TodoList and parse existing todo.txt content
const todoList = new TodoList();
const todoContent = `
(A) 2023-04-01 Call Mom @phone +Family due:2023-04-15
x 2023-03-20 2023-03-01 Buy groceries @store
2023-04-02 Start work on proposal +Project @computer due:2023-04-10
`;
todoList.parse(todoContent);

// Add a new task by string
todoList.addTask(
  "(B) Schedule dentist appointment @phone +Health due:2023-05-10"
);

// Add a new task by object
const newTask = new Task({
  description: "Prepare presentation",
  priority: "C",
  project: "Work", // Will be formatted to +Work
  context: "computer", // Will be formatted to @computer
  due: "2023-04-15",
});
todoList.addTask(newTask);

// Display all tasks
console.log(todoList.toString());

// Get incomplete tasks due in the next 7 days
const upcomingTasks = todoList.getDueInNextNDaysTasks(7);
console.log("Tasks due soon:", upcomingTasks.length);

// Filter tasks by multiple criteria
const phoneTasks = todoList.filter({
  completed: false,
  context: "@phone",
  dueBefore: "2023-05-01",
});
console.log("Phone tasks due before May:", phoneTasks.length);

// Get all unique projects in use
const projects = todoList.getProjects();
console.log("Projects:", projects);
```

### Working with Tasks

```ts
import { Task, RecurrencePattern } from "todotxt4js";

// Create a task
const task = new Task({
  description: "Weekly team meeting",
  priority: "B",
  context: "work",
  project: "TeamSync",
  due: "2023-05-01",
});

// Manipulate task properties
task.setDescription("Weekly team sync meeting");
task.setPriority("A");
task.addContext("zoom");
task.addProject("Important");
task.setDueDate("2023-05-08");

// Check due status
console.log("Days until due:", task.daysUntilDue());
console.log("Is overdue:", task.isOverdue());
console.log("Is due today:", task.isDueToday());

// Set up recurrence
task.setRecurrence({ type: "weekly", interval: 1 });

// Make the task recurring
const nextOccurrence = task.generateRecurringTask();
if (nextOccurrence) {
  console.log("Next occurrence due:", nextOccurrence.getDueDate());
}

// Mark as completed
task.markCompleted(); // Uses today's date
// Or specify completion date:
// task.markCompleted("2023-05-01");

// Convert to string format
console.log(task.toString());
```

### Advanced Filtering and Querying

```ts
import { TodoList } from "todotxt4js";

const todoList = new TodoList(existingTodoContent);

// Get tasks by various criteria
const workTasks = todoList.getTasksByProject("+Work");
const phoneTasks = todoList.getTasksByContext("@phone");
const highPriorityTasks = todoList.getTasksByProperty("priority", "(A)");
const dueSoonTasks = todoList.getDueInNextNDaysTasks(7);
const overdueTasks = todoList.getOverdueTasks();

// Get task by line number (useful for UI integration)
const taskAtLine3 = todoList.getTaskByLineNumber(2); // 0-based index

// Get available metadata
const allProjects = todoList.getProjects();
const allContexts = todoList.getContexts();
const allKeyNames = todoList.getKeyNames();

// Multi-criteria filtering
const filteredTasks = todoList.filter({
  completed: false,
  priority: "(A)",
  project: "+Work",
  context: "@computer",
  dueAfter: "2023-04-01",
  dueBefore: "2023-05-01",
});
```

### Custom Key Handling

```ts
import { TodoList, ParserOptions, KeyHandler } from "todotxt4js";

// Custom key handlers for validation and transformation
const customHandlers: KeyHandler[] = [
  {
    key: "due",
    validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
    transform: (value) => new Date(value),
  },
  {
    key: "priority-level",
    transform: (value) => parseInt(value),
  },
];

const parserOptions: ParserOptions = {
  duplicateKeyBehavior: "merge", // Can be "error", "overwrite", or "merge"
  customKeyHandlers: customHandlers,
};

const todoList = new TodoList();
todoList.parse(todoContent, parserOptions);
```

## Building and Testing

Build the library:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Generate documentation:

```bash
npm run generate-docs
```

## License

MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request
