const express = require("express");

const router = express.Router();

const{login,signup,sendpasswordlink,forgotpassword,changepassword,sendOTPVerificationEmail,verifyotp,resendOTPVerificationCode} = require("../controllers/auth");

router.post("/login",login);
router.post("/signup",signup);
router.post("/sendpasswordlink",sendpasswordlink);
router.get("/forgotpassword/:id/:token",forgotpassword);
router.post("/:id/:token", changepassword);
//router.post("/sendOTPVerificationEmail",sendOTPVerificationEmail);
router.post("/verifyotp",verifyotp);
router.post("/resendOTPVerificationCode",resendOTPVerificationCode);
module.exports = router;