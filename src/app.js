const express = require("express");
const cors = require("cors");
const { isHttpError, createHttpError } = require("http-errors");
const morgan = require("morgan");
const userRoutes = require("./routes/users");
const offerRoutes = require("./routes/offers");

// Initializations
const app = express();

// Middlewares
app.use(morgan("dev"));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}))

// Body parser
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello Vinted API" });
});
app.use("/user", userRoutes);
app.use("/offer", offerRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;
  if (isHttpError(error)) {
    errorMessage = error.message;
    statusCode = error.status;
  }
  res.status(statusCode).json({ message: errorMessage });
});

module.exports = app;
