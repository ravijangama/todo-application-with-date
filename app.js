const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const { format } = require("date-fns");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log(`Server Is Starting @3000`));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//GET TODO API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  if (status !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        status LIKE "${status}"; `;
    const todoList = await db.all(getTodoQuery);
    if (todoList[0] !== undefined) {
      response.send(todoList);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        priority LIKE "${priority}"; `;
    const todoList = await db.all(getTodoQuery);
    if (todoList[0] !== undefined) {
      response.send(todoList);
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined && priority !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        status LIKE "${status}"
        AND priority LIKE "${priority}"; `;
    const todoList = await db.all(getTodoQuery);
    response.send(todoList);
  } else if (search_q !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        todo LIKE "%${search_q}%"; `;
    const todoList = await db.all(getTodoQuery);
    response.send(todoList);
  } else if (category !== undefined && status !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        category LIKE "${category}"
        AND status LIKE "${status}"; `;
    const todoList = await db.all(getTodoQuery);
    response.send(todoList);
  } else if (category !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        category LIKE "${category}"; `;
    const todoList = await db.all(getTodoQuery);
    if (todoList[0] !== undefined) {
      response.send(todoList);
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (category !== undefined && priority !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        category LIKE "${category}"
        AND status LIKE "${priority}"; `;
    const todoList = await db.all(getTodoQuery);
    response.send(todoList);
  }
});
//Get Specific Todo API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        id=${todoId}; `;
  const todoList = await db.get(getTodoQuery);
  response.send(todoList);
});
//Get Todo With Date API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = new Date(`${date}`);
  const Year = newDate.getFullYear();
  const Month = newDate.getMonth();
  const D = newDate.getDate();
  const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        CAST(strftime("%Y",due_date) AS INT)=${Year}
        AND CAST(strftime("%m",due_date) AS INT)=${Month}
        AND CAST(strftime("%d",due_date) AS INT)=${D};`;
  const todoList = await db.get(getTodoQuery);
  response.send(todoList);
});
