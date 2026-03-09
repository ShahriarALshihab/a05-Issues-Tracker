
## 📝 JavaScript Concepts — Q&A

### 1️⃣ What is the difference between `var`, `let`, and `const`?

`var` is the old way to declare variables. It is function-scoped, meaning it is accessible anywhere inside the function it was declared in. It also gets hoisted to the top of its scope, which can cause unexpected bugs because you can use it before it is declared.

`let` is the modern replacement for `var`. It is block-scoped, meaning it only exists inside the block `{}` where it was declared. It cannot be accessed before its declaration, which makes it safer and more predictable.

`const` is also block-scoped like `let`, but it cannot be reassigned after it is declared. It must be given a value at the time of declaration. Use `const` when the value is not supposed to change.

The general rule is to always use `const` by default, use `let` when you know the value will need to change, and avoid `var` entirely in modern JavaScript.

---

### 2️⃣ What is the spread operator (`...`)?

The spread operator is written as three dots and it is used to expand or unpack the elements of an array or the properties of an object into individual pieces. It is very useful when you want to copy an array or object without modifying the original, or when you want to merge two arrays or objects together into one. It can also be used to pass array items as separate arguments into a function. The spread operator makes working with arrays and objects much cleaner and shorter compared to older approaches.

---

### 3️⃣ What is the difference between `map()`, `filter()`, and `forEach()`?

All three are array methods that loop through items, but they serve different purposes and behave differently.

`map()` goes through every item in an array and returns a brand new array where each item has been transformed based on the function you provide. The original array is not changed. Use it when you want to convert each item into something else.

`filter()` goes through every item and returns a new array containing only the items that pass a condition you define. Items that do not meet the condition are left out. The original array remains unchanged. Use it when you want to narrow down a list based on some criteria.

`forEach()` also loops through every item and runs a function for each one, but it does not return anything at all. It is used purely for performing side effects, such as logging values or updating the DOM. Since it returns nothing, you cannot chain it or use its result like you can with `map()` or `filter()`.

---

### 4️⃣ What is an arrow function?

An arrow function is a shorter and more concise way to write a function in JavaScript, introduced in ES6. Instead of using the `function` keyword, you use the `=>` arrow syntax. If the function body contains only a single expression, you can skip the curly braces and the return keyword, as the value is returned automatically. Arrow functions are commonly used as callbacks inside methods like `map()`, `filter()`, and event listeners because of their compact syntax. One important difference from regular functions is that arrow functions do not have their own `this` — they inherit `this` from the surrounding context, which makes them especially useful inside classes and objects.

---

### 5️⃣ What are template literals?

Template literals are a modern way to write strings in JavaScript, introduced in ES6. Instead of using single or double quotes, you wrap the string in backticks. The biggest advantage is that you can embed variables or any JavaScript expression directly inside the string using the `${}` syntax, instead of breaking the string apart and joining it with `+` signs. This makes the code much cleaner and easier to read. Template literals also support multi-line strings naturally, meaning you can write a string across multiple lines without needing any special characters.

---

## ✨ Features

- Login page with credential validation
- View all issues in a 4-column card layout
- Filter issues by status: All, Open, Closed
- Search issues by title, description, label, author, priority, or ID
- Click any card to view full issue details in a modal
- Color-coded cards: green border for Open, purple for Closed
- Loading spinner on data fetch
- Fully responsive for mobile devices