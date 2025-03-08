const express = require("express");
const tableController = require("../controllers/tableController");
const router = express.Router();

router.post("/createTable", tableController.createTable);

router.get("/", tableController.getAllTables);

module.exports = router;
