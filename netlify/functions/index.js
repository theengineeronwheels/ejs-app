const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const app = express();

// Set the view engine and views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Define the route
app.get("/", (req, res) => {
  res.render("index", { title: "My EJS App" });
});

// Export as a Netlify function
module.exports.handler = serverless(app);