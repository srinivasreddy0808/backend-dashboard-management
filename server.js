const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const tableController = require("./controllers/tableController");
const app = require("./app");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successful");
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });

const port = process.env.PORT || 3000;

tableController.tableSocket(io);

app.listen(port, () => {
  console.log(`app is successfully running in the port ${port}`);
});
