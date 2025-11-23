const express = require("express");
const fetch = require("node-fetch");
const csv = require("csvtojson");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const API_KEY = "Xf-OXVL-QeCqMyUIgJZLIA";

// Helper function to call Premiumy API (CSV endpoint)
async function callCSVMethod(method, params = {}) {
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
  const jsonData = await csv().fromString(csvData); // Convert CSV to JSON
  return jsonData;
}

// Helper function to call Premiumy API (JSON endpoint)
async function callJSONMethod(method, params = {}) {
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
}

// Route 1: Full MDR List
app.post("/api/messages", async (req, res) => {
  try {
    const { start_date, end_date, senderid, phone, page = 1, per_page = 50 } = req.body;

    const params = {
      filter: {
        start_date,
        end_date,
        senderid: senderid || "",
        phone: phone || "",
      },
      page,
      per_page,
    };

    const data = await callCSVMethod("sms.mdr_full:get_listCSV", params);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching MDR list" });
  }
});

// Route 2: Grouped SMS Traffic
app.post("/api/messages/group", async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      senderid,
      phone,
      group = "",
      sort1 = "",
      sort1_desc = true,
      sort2 = "",
      sort2_desc = true,
      page = 1,
      per_page = 50,
    } = req.body;

    const params = {
      filter: {
        start_date,
        end_date,
        senderid: senderid || "",
        phone: phone || "",
      },
      group,
      sort1,
      sort1_desc,
      sort2,
      sort2_desc,
      page,
      per_page,
    };

    const data = await callCSVMethod("sms.mdr_full:group_get_listCSV", params);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching grouped SMS" });
  }
});

// Route 3: Last SMS by Phone
app.post("/api/messages/last", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

    const data = await callJSONMethod("sms.mdr_full:get_message_by_phone", { phone });
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching last SMS" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
