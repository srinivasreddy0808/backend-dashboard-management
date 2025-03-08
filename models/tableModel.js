const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableSheetId: {
    type: String,
    required: true,
  },
  tableName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Table", tableSchema);
