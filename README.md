# todotxt4js

[![npm version](https://img.shields.io/npm/v/todotxt4js.svg)](https://www.npmjs.com/package/todotxt4js)

A comprehensive TypeScript implementation of the todo.txt format specification. This library provides robust parsing, querying, and management of todo.txt todos with additional functionality like recurrence patterns, due dates, and metadata handling.

## Features

- Robust Parsing: Parse todos with completion markers, priorities, dates, projects, contexts, and key-value pairs
- Task Management: Create, edit, delete, and query todos with a fluent API
- Metadata Support: Work with projects, contexts, priorities, and custom key-value pairs
- Date Handling: Due dates, overdue detection, days-until-due calculations
- Recurrence Patterns: Support for recurring todos (daily, weekly, monthly, yearly)
- Filtering & Sorting: Filter by multiple criteria and sort by different properties
- Customizable Behavior: Configure duplicate key handling and register custom key handlers for validation/transformation
- Full TypeScript Support: Strong typing for improved development experience
- Compatibility: Uses character-by-character parsing instead of regular expressions

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
import { TodoList, Todo } from "todotxt4js";

// Create a new TodoList and parse existing todo.txt content
const todoList = new TodoList();
const todoContent = `
(A) 2023-04-01 Call Mom @phone +Family due:2023-04-15
x 2023-03-20 2023-03-01 Buy groceries @store
2023-04-02 Start work on proposal +Project @computer due:2023-04-10
`;
todoList.parse(todoContent);

// Add a new todo by string
todoList.addTodo(
  "(B) Schedule dentist appointment @phone +Health due:2023-05-10"
);

// Add a new todo by object
const newTodo = new Todo({
  description: "Prepare presentation",
  priority: "C",
  projects: ["Work"], // Will be formatted to +Work
  contexts: ["computer"], // Will be formatted to @computer
  due: "2023-04-15",
});
todoList.addTodo(newTodo);

// Display all todos
console.log(todoList.toString());

// Get incomplete todos due in the next 7 days
const upcomingTodos = todoList.getDueInNextNDaysTodos(7);
console.log("Todos due soon:", upcomingTodos.length);

// Filter todos by multiple criteria
const phoneTodos = todoList.filter({
  completed: false,
  contexts: ["@phone"],
  dueBefore: "2023-05-01",
});
console.log("Phone todos due before May:", phoneTodos.length);

// Get all unique projects in use
const projects = todoList.getProjects();
console.log("Projects:", projects);
```

### Working with Todos

```ts
import { Todo, RecurrencePattern } from "todotxt4js";

// Create a todo
const todo = new Todo({
  description: "Weekly team meeting",
  priority: "B",
  contexts: ["work"],
  projects: ["TeamSync"],
  due: "2023-05-01",
});

// Manipulate todo properties
todo.setDescription("Weekly team sync meeting");
todo.setPriority("A");
todo.addContext("zoom");
todo.addProject("Important");
todo.setDueDate("2023-05-08");

// Check due status
console.log("Days until due:", todo.daysUntilDue());
console.log("Is overdue:", todo.isOverdue());
console.log("Is due today:", todo.isDueToday());

// Set up recurrence
todo.setRecurrence({ type: "weekly", interval: 1 });

// Make the todo recurring
const nextOccurrence = todo.generateRecurringTodo();
if (nextOccurrence) {
  console.log("Next occurrence due:", nextOccurrence.getDueDate());
}

// Mark as completed
todo.markCompleted(); // Uses today's date
// Or specify completion date:
// todo.markCompleted("2023-05-01");

// Convert to string format
console.log(todo.toString());
```

### Advanced Filtering and Querying

```ts
import { TodoList } from "todotxt4js";

const todoList = new TodoList(existingTodoContent);

// Get todos by various criteria
const workTodos = todoList.getTodosByProject("+Work");
const phoneTodos = todoList.getTodosByContext("@phone");
const highPriorityTodos = todoList.getTodosByProperty("priority", "(A)");
const dueSoonTodos = todoList.getDueInNextNDaysTodos(7);
const overdueTodos = todoList.getOverdueTodos();

// Get todo by line number (useful for UI integration)
const todoAtLine3 = todoList.getTodoByLineNumber(2); // 0-based index

// Get available metadata
const allProjects = todoList.getProjects();
const allContexts = todoList.getContexts();
const allKeyNames = todoList.getKeyNames();

// Multi-criteria filtering
const filteredTodos = todoList.filter({
  completed: false,
  priority: "(A)",
  projects: ["+Work"],
  contexts: ["@computer"],
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
