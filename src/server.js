// src/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// omogućava da Express čita JSON iz POST zahteva
app.use(express.json());

// 🔹 služi statičke fajlove iz foldera public (koji je jedan nivo iznad src)
app.use(express.static(path.join(__dirname, "..", "public")));

// 🔹 kada neko otvori root "/", pošalji public/index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 🔹 backend ruta za upis emaila
app.post("/save-email", (req, res) => {
  const { email, service } = req.body || {};
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email je obavezan." });
  }

  const timestamp = new Date().toISOString();
  const line = `${timestamp}\t${service || "unknown"}\t${email}\n`;

  const filePath = path.join(__dirname, "mail.txt");
  fs.appendFile(filePath, line, (err) => {
    if (err) {
      console.error("Greška pri upisu:", err);
      return res.status(500).json({ ok: false, error: "Greška pri upisu fajla." });
    }
    res.json({ ok: true });
  });
});

// pokreni server
app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
