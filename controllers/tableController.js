const Table = require("../models/tableModel");
const dotenv = require("dotenv").config();
const { google } = require("googleapis");
const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

// Configure the Google Sheets API client
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

exports.createTable = async (req, res) => {
  const { tableName, headers } = req.body;

  try {
    // Create a new Google Sheet
    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: { title: tableName },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Add headers to the first row of the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "A1",
      valueInputOption: "RAW",
      resource: { values: [headers] },
    });

    // Set permissions to allow anyone with the link to edit
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { role: "writer", type: "anyone" },
    });

    // Get the public URL of the sheet
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Save the spreadsheet ID to MongoDB
    const newTable = new Table({ tableSheetId: spreadsheetId, tableName });
    await newTable.save();

    res.status(201).json({
      message: "Table created successfully",
      spreadsheetId,
      sheetUrl,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create table" });
  }
};

const fetchTableData = async (sheetId) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A1:B",
  });
  return response.data.values;
};

exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find();
    console.log(tables, "tables");
    const tableData = await Promise.all(
      tables.map(async (table) => {
        try {
          const data = await fetchTableData(table.tableSheetId);
          return { id: table.tableSheetId, name: table.tableName, rows: data };
        } catch (error) {
          console.error("Error fetching table data:", error);
        }
        return { id: table.tableSheetId, name: table.tableName, rows: [] };
      })
    );
    res.status(200).json(tableData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tables", error });
  }
};

exports.tableSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("fetchTables", async () => {
      const tables = await Table.find();
      const tableData = await Promise.all(
        tables.map(async (table) => {
          const data = await fetchTableData(table.tableSheetId);
          return { id: table.tableSheetId, name: table.tableName, rows: data };
        })
      );
      io.emit("tablesUpdated", tableData);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
