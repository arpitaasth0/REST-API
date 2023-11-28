const express = require("express");

const router = express.Router();

const{login,signup,sendotp,changePassword} = require("../controllers/auth");

const {resetPasswordToken,resetPassword,} = require("../controllers/ResetPassword");
  

router.post("/login",login);

router.post("/signup",signup);

router.post("/sendotp", sendotp);


//for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);

//for resetting user's password after verification
router.post("/reset-password", resetPassword);

router.post("/changepassword",changePassword);

module.exports = router;