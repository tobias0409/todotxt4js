# todotxt4js

todotxt4js is a lightweight, portable todotxt parser and integration written in TypeScript. It provides a simple, class-based implementation to tokenize and parse tasks written in the todotxt format, making it easy to integrate into any Markdown-based workflow or application, such as Obsidian.

## Features

- **Robust Parsing:**  
  Parse tasks with optional completion markers, priorities, dates, projects, contexts, and key–value pairs.
- **Customizable Behavior:**  
  Configure duplicate key handling ("error", "overwrite", or "merge") and register custom key handlers for validations and transformations.
- **Todo List Management:**  
  Create and manage a list of tasks from a multiline todotxt file. Easily add tasks and convert the list back to a string.
- **Error Handling:**  
  Uses custom error classes for clear reporting of parsing issues.

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

Here's a simple example to get you started:

```ts
import { Scanner } from "todomd/Scanner";
import { Parser } from "todomd/Parser";
import { TodoList } from "todomd/TodoList";

const exampleText = `
x (A) 2020-12-31 2020-12-30 Call mom +Family @Phone due:2021-01-01
(A) 2011-03-02 Call Mom @home
Post signs around the neighborhood +GarageSale
@GroceryStore pies
`;

// Using the TodoList class to parse a multiline todotxt text:
const todoList = new TodoList();
todoList.parse(exampleText);
console.log("Parsed Todo List:\n", todoList.toString());

// Alternatively, create and add individual tasks:
todoList.addTask("(A) Call Mom @phone due:2021-07-01");
console.log("Updated Todo List:\n", todoList.toString());
```
