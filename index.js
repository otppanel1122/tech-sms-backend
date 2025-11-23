const express = require("express");
const fetch = require("node-fetch");
const csv = require("csvtojson");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ CORS enabled

const app = express();
app.use(bodyParser.json());
app.use(cors()); // ✅ Allow frontend requests

const API_KEY = "j-vf6jSIS1euBCikzPEFkQ"; // ✅ New whitelisted API key

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

    const text = await response.text();

    // Check for Premiumy errors
    if (text.includes('"error"')) {
      console.error("Premiumy API Error:", text);
      throw new Error("Premiumy API rejected the request. Check API key and IP whitelist.");
    }

    const jsonData = await csv().fromString(text);
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
    if (json.error) {
      console.error("Premiumy JSON API error:", json);
      throw new Error(json.error.message || "Premiumy JSON API error");
    }

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
    res.status(500).json({ success: false, message: err.message || "Error fetching last SMS" });
  }
});

// Route 4: Optional test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend is live!" });
});

// Route 5: Get current public IP (for Premiumy whitelist)
app.get("/api/myip", async (req, res) => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    res.json({ success: true, ip: data.ip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
