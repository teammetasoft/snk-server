require("dotenv").config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

app.use(
  cors({
    // origin: process.env.FRONT_END_PORT,
    origin: [
      process.env.FRONT_END_PORT,
      process.env.FRONT_END_PORT1,
      process.env.FRONT_END_PORT2,
    ],
    credentials: true, //access-control-allow-credentials:true
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const authRouter = require("./routes/authRouter");
const schemeRouter = require("./routes/schemeRouter");
const planRouter = require("./routes/subscriptionRouter");

app.use("/api/auth", authRouter);
app.use("/api/scheme", schemeRouter);
app.use("/api/plan", planRouter);

app.get("/api/health", async (req, res) => {
  try {
    // Send the response data back to the client
    res.status(200).json({ status: "OK" });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.send(500).json(error);
  }
});

const { connectDb } = require("./config/connection");
connectDb();

app.use((err, req, res, next) => {
  const error = {
    success: false,
    status: err.status || 500,
    message: err.message || "Something went wrong",
  };
  res.status(error.status).json(error);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`));
