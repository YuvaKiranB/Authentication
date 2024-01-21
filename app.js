const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const dbpath = path.join(__dirname, "userData.db");
let db = null;

const startDB = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

startDB();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userDetails = `
  SELECT *
  FROM user
  WHERE username = "${username}"`;
  const dbUser = await db.get(userDetails);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const writeUser = `
      INSERT INTO user(username, name, password, gender, location)
      VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}");`;
    await db.run(writeUser);
    response.send("User created successfully");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userDetails = `
    SELECT *
    FROM user
    WHERE username = "${username}"`;
  const dbUser = await db.get(userDetails);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else if (await bcrypt.compare(password, dbUser.password)) {
    response.send("Login success!");
  } else {
    response.status(400);
    response.send("Invalid password");
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userDetails = `
    SELECT *
    FROM user
    WHERE username = "${username}"`;
  const dbUser = await db.get(userDetails);
  if (await bcrypt.compare(oldPassword, dbUser.password)) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log(hashedPassword);
      console.log(newPassword);
      const updatePassword = `
            UPDATE user
            SET
            password = "${hashedPassword}"
            WHERE username = "${username}";`;
      await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
