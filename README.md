# todotxt4js

todotxt4js is a lightweight, portable todotxt parser and integration written in TypeScript. It provides a simple, class-based implementation to tokenize and parse tasks written in the todotxt format.

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
import { TodoList } from "todotxt4js/TodoList";

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
