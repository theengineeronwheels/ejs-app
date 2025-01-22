const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("./database/database.sqlite");

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    store: new SQLiteStore(),
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  })
);

// Utility: Check authentication
const requireAuth = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

// Routes
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body; // Extract email and password from the request body

  if (!email || !password) {
    return res.render("login", { error: "Email and password are required!" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) throw err;

    // Check if user exists and the password matches
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render("login", { error: "Invalid credentials!" });
    }

    // Set the user session and redirect to the members area
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      permit_type: user.permit_type,
    };
    res.redirect("/members");
  });
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const { email, password, first_name, last_name, permit_type } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 12);

  db.run(
    "INSERT INTO users (email, password, first_name, last_name, permit_type) VALUES (?, ?, ?, ?, ?)",
    [email, hashedPassword, first_name, last_name, permit_type],
    (err) => {
      if (err) {
        return res.render("register", { error: "Member already exists!" });
      }
      res.redirect("/login");
    }
  );
});

app.get("/members", requireAuth, (req, res) => {
  res.render("members", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));