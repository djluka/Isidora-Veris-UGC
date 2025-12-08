const express = require("express");
const app = express();

// Root endpoint
app.get("/", (req, res) => {
    res.send("Backend radi! Ovo je odgovor iz src kontejnera.");
});

// Moramo slušati na 0.0.0.0 u Dockeru
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server radi na portu ${PORT}`);
});
