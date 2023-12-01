const express = require("express");
const cors = require("cors");
const app = express();

require('dotenv').config();
const PORT = process.env.PORT|| 4000;

app.use(express.json());

app.use(cors());

require("./config/database").connect();

//route import and mount
const user = require("./routes/User");
app.use("/api/v1/auth",user);

app.listen(PORT, () => {
    console.log("app is listening at port 4000");
})