const express = require("express");
const fetch = require("node-fetch");
const csv = require("csvtojson");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ Import CORS

const app = express();
app.use(bodyParser.json());
app.use(cors()); // ✅ Enable CORS for all domains

const API_KEY = "Xf-OXVL-QeCqMyUIgJZLIA";

// Helper function to call Premiumy CSV API
async function callCSVMethod(method, params = {}) {
  try {
    const response = await fetch("https://api.premiumy.net/v1.0/csv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": API_KEY,
      },
      body: JSON.stringify({
        id: null,
        jsonrpc: "2.0",
        method,
        params,
      }),
    });

    const csvData = await response.text();

    if (!csvData || csvData.length === 0) {
      throw new Error("Empty CSV response from API");
    }

    const jsonData = await csv().fromString(csvData); // CSV → JSON
    return jsonData;
  } catch (err) {
    console.error("CSV API error:", err);
    throw err;
  }
}

// Helper function to call Premiumy JSON API
async function callJSONMethod(method, params = {}) {
  try {
    const response = await fetch("https://api.premiumy.net/v1.0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": API_KEY,
      },
      body: JSON.stringify({
        id: null,
        jsonrpc: "2.0",
        method,
        params,
      }),
    });

    const json = await response.json();
    return json.result || json;
  } catch (err) {
    console.error("JSON API error:", err);
    throw err;
  }
}

// Route 1: Full MDR List
app.post("/api/messages", async (req, res) => {
  try {
    const { start_date, end_date, senderid = "", phone = "", page = 1, per_page = 50 } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: "start_date and end_date are required" });
    }

    const params = {
      filter: { start_date, end_date, senderid, phone },
      page,
      per_page,
    };

    const data = await callCSVMethod("sms.mdr_full:get_listCSV", params);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in /api/messages:", err);
    res.status(500).json({ success: false, message: err.message || "Error fetching MDR list" });
  }
});

// Route 2: Grouped SMS Traffic
app.post("/api/messages/group", async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      senderid = "",
      phone = "",
      group = "",
      sort1 = "",
      sort1_desc = true,
      sort2 = "",
      sort2_desc = true,
      page = 1,
      per_page = 50,
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: "start_date and end_date are required" });
    }

    const params = { filter: { start_date, end_date, senderid, phone }, group, sort1, sort1_desc, sort2, sort2_desc, page, per_page };
    const data = await callCSVMethod("sms.mdr_full:group_get_listCSV", params);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in /api/messages/group:", err);
    res.status(500).json({ success: false, message: err.message || "Error fetching grouped SMS" });
  }
});

// Route 3: Last SMS by Phone
app.post("/api/messages/last", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "phone is required" });

    const data = await callJSONMethod("sms.mdr_full:get_message_by_phone", { phone });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in /api/messages/last:", err);
    res.status(500).json({ success: false, message: err.message || "Error fetching last SMS" });
  }
});

// Temporary test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend is working!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
