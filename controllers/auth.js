const bcrypt = require("bcrypt");
const User = require("../models/user");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
require("dotenv").config();

exports.signup = async(req,res) => {
    try{
        const{email,password,name,confirmPassword,otp} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message :'user already exists',
            });
        }
     
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
		console.log(response);
		if (response.length === 0) {
			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		} else if (otp !== response[0].otp) {
			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		}  
        let hashedPassword;
        try{
            hashedPassword = await bcrypt.hash(password,10);
        }
        catch(err){
            return res.status(500).json({
                success:false,
                message:'error in hashing password',
            });
        }

        const user = await User.create({
            email,password:hashedPassword,name,confirmPassword,
        });

        return res.status(200).json({
            success:true,
            message:'user created successfully'
        });
    }
        catch(error){
           console.error(error);
           return res.status(500).json({
            success:false,
            message:'user cannot be registered,please try again later '
           });
            
            }

    }


    exports.login = async(req,res) => {
        try{
           const{email,password} = req.body;
           if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'fill all the details carefully',
            });
           }
           const user = await User.findOne({email});

           if(!user){
            return res.status(401).json({
                success:false,
                message:'user is not registered',
            });
           }
            const payload = {
                email:user.email,
                id:user._id,
                role:user.role,
            };

            if(await bcrypt.compare(password,user.password)){
             let token = jwt.sign(payload,
                                process.env.JWT_SECRET,
                                   {
                                    expiresIn:"1h",
                                   }  );
            user.token = token;
            user.password = undefined;
            
             const options = {
                  expires:new Date (Date.now() + 3 *24*60*60*1000),
                  httpOnly:true,
             }

             res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"user logged in successfully"
             });
            
           }
           else{
            return res.status(403).json({
                success:false,
                message:'password incorrect',
            });
           }
        }
        catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:'login failure',
            });

        }
    }

    exports.sendotp = async (req, res) => {
        try {
            const { email } = req.body;
    
            const checkUserPresent = await User.findOne({ email });
    
            if (checkUserPresent) {
                return res.status(401).json({
                    success: false,
                    message: `User is Already Registered`,
                });
            }
    
            var otp = otpGenerator.generate(4, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            const result = await OTP.findOne({ otp: otp });
            console.log("Result is Generate OTP Func");
            console.log("OTP", otp);
            console.log("Result", result);
            while (result) {
                otp = otpGenerator.generate(4, {
                    upperCaseAlphabets: false,
                });
            }
            const otpPayload = { email, otp };
            const otpBody = await OTP.create(otpPayload);
            console.log("OTP Body", otpBody);
    
            res.status(200).json({
                success: true,
                message: `OTP Sent Successfully`,
                otp,
            });
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    };
    
    
    exports.changePassword = async (req, res) => {
	try {
		const userDetails = await User.findById(req.user.id);

		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if(oldPassword === newPassword){
			return res.status(400).json({
				success: false,
				message: "New Password cannot be same as Old Password",
			});
		}
		
		if (!isPasswordMatch) {
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		if (newPassword !== confirmNewPassword) {
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				"Password Updated",
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.name}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};
