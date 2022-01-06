const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(process.env.PORT || 3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Register API
app.post("/register", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    select * from userDetails where username="${username}"
    `;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    const insertIntoQuery = `
            insert into userDetails values("${username}","${hashedPassword}")
        `;
    const databaseUser = await database.run(insertIntoQuery);
    response.status(200);
    response.send("Registration is successful");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    select * from userDetails where username="${username}"
  `;
  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User Credentials");
  } else {
    if ((await bcrypt.compare(password, dbUser.password)) === true) {
      response.status(200);
      response.send("Login Successful");
    } else {
      response.status(400);
      response.send("Invalid Login Credentials");
    }
  }
});

app.post("/data", async (request, response) => {
  const dataArray = request.body;
  const dataValues = dataArray.map(
    (eachItem) =>
      `("${eachItem.userId}","${eachItem.id}","${eachItem.title}","${eachItem.body}")`
  );
  const postValues = dataValues.join(",");
  const insertValuesIntoQuery = `
  insert into postData values ${postValues}
  `;
  const dbUser = await database.run(insertValuesIntoQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Data is invalid");
  } else {
    response.status(200);
    response.send("Data has been added to the database");
  }
});

app.get("/data", async (request, response) => {
  const getDataQuery = "select * from postData;";
  const dataArray = await database.all(getDataQuery);
  response.send(dataArray);
});

module.exports = app;
