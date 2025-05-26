const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Express PostgreSQL App!");
});

// Example route to get data from the database
app.get("/data", async (req, res) => {
  try {
    const client = await db.getClient();
    const result = await client.query("SELECT * FROM mcp_schema.users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
