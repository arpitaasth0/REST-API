const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
//signup route handler
exports.signup = async(req,res) => {
    try{
        //get data
        const{email,password,name,confirmPassword} = req.body;
        //check if user already exist
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message :'user already exists',
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

        //create entry for user
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


    //login 
    exports.login = async(req,res) => {
        try{
           //data fetch
           const{email,password} = req.body;
           //validation on email and password
           if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'fill all the details carefully',
            });
           }
           //check for registered user
           const user = await User.findOne({email});

           //if not a registered user
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
           //verify password & generate a JWT token
           if(await bcrypt.compare(password,user.password)){
             //password match
             let token = jwt.sign(payload,
                                process.env.JWT_SECRET,
                                   {
                                    expiresIn:"1h",
                                   }  );
            //user = user.toObject();
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
            //password do not match
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

    // email config

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
}) 
// send email Link For reset Password
exports.sendpasswordlink = async(req,res) =>{
    console.log(req.body)

    const {email} = req.body;

    if(!email){
        res.status(401).json({status:401,message:"Enter Your Email"})
    }

    try {
        const userfind = await User.findOne({email:email});

        // token generate for reset password
        const token = jwt.sign({_id:userfind._id},keysecret,{
            expiresIn:"120s"
        });
        
        const setusertoken = await User.findByIdAndUpdate({_id:userfind._id},{verifytoken:token},{new:true});


        if(setusertoken){
            const mailOptions = {
                from:process.env.EMAIL,
                to:email,
                subject:"Sending Email For password Reset",
                text:`This Link Valid For 2 MINUTES http://localhost:3001/forgotpassword/${userfind.id}/${setusertoken.verifytoken}`
            }

            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log("error",error);
                    res.status(401).json({status:401,message:"email not send"})
                }else{
                    console.log("Email sent",info.response);
                    res.status(201).json({status:201,message:"Email sent Succsfully"})
                }
            })

        }

    } catch (error) {
        res.status(401).json({status:401,message:"invalid user"})
    }

};


// verify user for forgot password time

exports.forgotpassword = async(req,res)=>{
    const {id,token} = req.params;

    try {
        const validuser = await User.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        console.log(verifyToken)

        if(validuser && verifyToken._id){
            res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }

    } catch (error) {
        res.status(401).json({status:401,error})
    }
};


// change password

exports.changepassword= async(req,res)=>{
    const {id,token} = req.params;

    const {password} = req.body;

    try {
        const validuser = await User.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        if(validuser && verifyToken._id){
            const newpassword = await bcrypt.hash(password,12);

            const setnewuserpass = await User.findByIdAndUpdate({_id:id},{password:newpassword});

            setnewuserpass.save();
            res.status(201).json({status:201,setnewuserpass})

        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
}



       
           
   
   
         