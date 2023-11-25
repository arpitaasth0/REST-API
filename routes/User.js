const express = require("express");
const router = express.Router();

const{login,signup,sendpasswordlink,forgotpassword,changepassword} = require("../controllers/auth");

router.post("/login",login);
router.post("/signup",signup);
router.post("/sendpasswordlink",sendpasswordlink);
router.get("/forgotpassword/:id/:token",forgotpassword);
router.post("/:id/:token", changepassword);

module.exports = router;