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
const convertDBToTodoList = (todoObj) => {
  return {
    id: todoObj.id,
    todo: todoObj.todo,
    priority: todoObj.priority,
    status: todoObj.status,
    category: todoObj.category,
    dueDate: todoObj.due_date,
  };
};
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
      response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
      response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
    response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
  } else if (search_q !== undefined) {
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        todo LIKE "%${search_q}%"; `;
    const todoList = await db.all(getTodoQuery);
    response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
    response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
      response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
    response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
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
  response.send(convertDBToTodoList(todoList));
});
//Get Todo With Date API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const result = isValid(new Date(date));
  let newDate = null;
  if (result) {
    newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE
        due_date="${newDate}" ;`;
    const todoList = await db.all(getTodoQuery);
    if (todoList[0] !== undefined) {
      response.send(todoList.map((eachTodo) => convertDBToTodoList(eachTodo)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//Create Todo API 4
app.post("/todos/", async (request, response) => {
  const todoItem = request.body;
  const { id, todo, priority, status, category, dueDate } = todoItem;
   let myArray = null;
  let result = null;
  switch (true) {
    case status !== undefined:
      myArray = ["DONE", "IN PROGRESS", "TO DO"];
      result = myArray.includes(status);
      if (!result) {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
    case priority !== undefined:
      myArray = ["HIGH", "MEDIUM", "LOW"];
      result = myArray.includes(priority);
      if (!result) {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
    case category !== undefined:
      myArray = ["WORK", "HOME", "LEARNING"];
      result = myArray.includes(category);
      if (!result) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      }

    case dueDate !== undefined:
      result = isValid(new Date(dueDate));
      if (!result) {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
  }
  const addTodoQuery = `
      INSERT INTO todo (id,todo,category,priority,status,due_date)
      VALUES(
          ${id},
          "${todo}",
          "${category}",
          "${priority}",
          "${status}",
          "${dueDate}"
      );`;
  getList = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});
//Update Todo API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  let myArray = null;
  let result = null;
  switch (true) {
    case requestBody.status !== undefined:
      myArray = ["DONE", "IN PROGRESS", "TO DO"];
      result = myArray.includes(requestBody.status);
      if (result) {
        updatedColumn = "Status";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
      break;
    case requestBody.priority !== undefined:
      myArray = ["HIGH", "MEDIUM", "LOW"];
      result = myArray.includes(requestBody.priority);
      if (result) {
        updatedColumn = "Priority";
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      myArray = ["WORK", "HOME", "LEARNING"];
      result = myArray.includes(requestBody.category);
      if (result) {
        updatedColumn = "Category";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      }
      break;
    case requestBody.dueDate !== undefined:
      result = isValid(new Date(requestBody.dueDate));
      if (result) {
        updatedColumn = "Due Date";
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
      break;
  }
  const getTodoQuery = `
    SELECT 
         * 
    FROM 
        todo
    WHERE 
        id=${todoId}; `;
  const todoList = await db.get(getTodoQuery);
  const {
    status = todoList.status,
    priority = todoList.priority,
    todo = todoList.todo,
    category = todoList.category,
    dueDate = todoList.due_date,
  } = request.body;
  const updateQuery = `
          UPDATE 
              todo
          SET
            status="${status}",
            priority="${priority}",
            todo="${todo}",
            category="${category}",
            due_date="${dueDate}"
          WHERE 
             id=${todoId};`;
  await db.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});
//Delete Todo API 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
      DELETE FROM 
         todo
      WHERE 
         id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
