const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserOTPVerification = require("../models/UserOTPVerification");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
//signup route handler
exports.signup = async (req, res) => {
  try {
    //get data
    const { email, password, name, confirmPassword } = req.body;
    //check if user already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user already exists",
      });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "error in hashing password",
      });
    }

    //create entry for user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      confirmPassword,
    });

    return res.status(200).json({
      success: true,
      message: "user created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "user cannot be registered,please try again later ",
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    //data fetch
    const { email, password } = req.body;
    //validation on email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "fill all the details carefully",
      });
    }
    //check for registered user
    const user = await User.findOne({ email });

    //if not a registered user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user is not registered",
      });
    }
    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };
    //verify password & generate a JWT token
    if (await bcrypt.compare(password, user.password)) {
      //password match
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      //user = user.toObject();
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "user logged in successfully",
      });
    } else {
      //password do not match
      return res.status(403).json({
        success: false,
        message: "password incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "login failure",
    });
  }
};
// email config

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});
// send email Link For reset Password
exports.sendpasswordlink = async (req, res) => {
  const { email } = req.body;
  try {
    const userfind = await User.findOne({ email: email });
    //console.log("Hello");
    // token generate for reset password
    const token = jwt.sign({ _id: userfind._id }, process.env.KEY_SECRET, {
      expiresIn: "120s",
    });
    //console.log("Hello1");
    const setusertoken = await User.findByIdAndUpdate(
      { _id: userfind._id },
      { verifytoken: token },
      { new: true }
    );
    //console.log("Hello2");
    if (setusertoken) {
      const mailOptions = {
        from: "arpitaasthana44332222@gmail.com",
        to: email,
        subject: "Sending Email For password Reset",
        text:validfor2minutes //localhost:3001/forgotpassword/${userfind.id}/${setusertoken.verifytoken},
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error", error);
          res.status(401).json({ status: 401, message: "email not send" });
        } else {
          console.log("Email sent", info.response);
          res
            .status(201)
            .json({ status: 201, message: "Email sent Succsfully" });
        }
      });
    }
  } catch (error) {
    res.status(401).json({ status: 401, message: "invalid user" });
  }
};

// verify user for forgot password time

exports.forgotpassword = async (req, res) => {
  const { id, token } = req.params;

  try {
    const validuser = await User.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, process.env.KEY_SECRET);

    console.log(verifyToken);

    if (validuser && verifyToken._id) {
      res.status(201).json({ status: 201, validuser });
    } else {
      res.status(401).json({ status: 401, message: "user not exist" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
};

// change password

exports.changepassword = async (req, res) => {
  const { id, token } = req.params;

  const { password } = req.body;

  try {
    const validuser = await User.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, process.env.KEY_SECRET);

    if (validuser && verifyToken._id) {
      const newpassword = await bcrypt.hash(password, 12);

      const setnewuserpass = await User.findByIdAndUpdate(
        { _id: id },
        { password: newpassword }
      );

      setnewuserpass.save();
      res.status(201).json({ status: 201, setnewuserpass });
    } else {
      res.status(401).json({ status: 401, message: "user not exist" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
};


//send otp verification email
const sendOTPVerificationEmail = async () => {
    try{
        const otp = '${Math.floor(1000 + Math.random()*9000)}';

        //mail options
        const mailOptions = {
            from:process.env.EMAIL,
            to:email,
            subject:"Verify Your Email",
            html:'<p> Enter <b>${otp}</b> in the app to verify your email address and complete the verification</p><p>This code <b>expires in 1 hour </b></p>'
                   
        };
        //hash the otp 
        const saltRounds = 10;

        const hashedOTP = await bcrypt.hash(otp,saltRounds);
        new UserOTPVerification({
            userId:_id,
            otp:hashedOTP,
            createdAT:Date.now(),
            expiresAt:Date.now() + 3600000,
        });
        //save otp record
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);
        res.json({
            status:"PENDING",
            message:"Verification otp mail sent",
            data:{
                userId:_id,
                email,
            },

        });
    }
    catch(error){res.json({
        status:"FAILED",
        message:error.message,
    });

    }
};

       //verify otp email
       exports.verifyotp = async(req,res) => {
        try{
            let{userId,otp} = req.body;
            if(!userId || !otp) {
                throw error ("empty otp details are not allowed");
            }else{
               const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
               });
               if(UserOTPVerificationRecords.length <= 0) {
                //no record found
                throw new error (
                    "Account record dosent exist or has been verified already .please signup or login."
                );
               } else {
                //user otp record exists
                const {expiresAt} = UserOTPVerificationRecords[0];
                const hashedOTP = UserOTPVerificationRecords[0].otp;

                if(expiresAt < Date.now()) {
                    //user otp record has expired
                    await UserOTPVerification.deleteMany({userId});
                    throw new error ("code has expired.please request again.");
                } else {
                    bcrypt.compare(otp,hashedOTP);

                    if(!validOTP) {
                        //supplied otp is wrong
                        throw new error("invalid code passed.check your inbox.");
                    } else {
                        //success
                       await User.updateOne({_id:userId},{verified:true});
                       await UserOTPVerification.deleteMany({userId});
                       res.json({
                        status:"VERIFIED",
                        message:"User email verified successfully",
                       });
                    }
                }

               }
            }
        } catch (error) {
            res.json({
                status:"FAILED",
                message:"error.message",
            });
        }
       };
           
   //resend verification
   exports.resendOTPVerificationCode = async(req,res) => {
    try{
        let{userId,email} = req.body;

        if(!userId || email) {
            throw error ("empty user details are not allowed");
        } else {
            //delete existing records and resend
            await UserOTPVerification.deleteMany({userId});
            sendOTPVerificationEmail({_id:userId,email},res);
        }
    } catch (error) {
        res.json({
            status:"FAILED",
            message:"error.message"
        });

    }
   }
   
         
       
           
   
   
         