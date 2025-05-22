const user=require('../models/userModel');
const bcrypt=require('bcrypt');
const {db}=require('../config/firebase_config');

const adduser=async (req,res)=>{
    try{
        const {authId,username,firstName,lastName,password,email,type}=req.body;
        const hashedpassword=await bcrypt.hash(password,10);
        const base64String = req.file.buffer.toString("base64");
        const userDetails={
            authId,
            username,
            firstName,
            lastName,
            role:"user",
            password:hashedpassword,
            image:base64String,
            email,
            type
        }
        const code = await user.insertNewUser(userDetails);
        if(code==200){
            return res.status(201).json({Message:"New user added"});
        }
        else {
            return res.status(500).json({Message:"Error creating the user"});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}

const loginuser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userRef = db.collection('users').where('username', '==', username);
        const document = await userRef.get();

        if (document.empty) {
            return res.status(401).json({ Message: "Username does not exist" });
        }

        let userData = null;
        document.forEach((doc) => {
            userData = doc.data();
        });

        if (!userData) {
            return res.status(401).json({ Message: "Username does not exist" });
        }

        const pwdCheck = await bcrypt.compare(password, userData.password);

        if (pwdCheck) {
            return res.status(200).json({ Message: "Login successful" });
        } else {
            return res.status(401).json({ Message: "Wrong password" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ Message: "Internal Server Error" });
    }
};

const getCurrentUser = async (req, res) => {
   const { vendorId } = req.params;
  try {
    const doc = await db.collection('users').doc(vendorId).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    return res.status(200).json(doc.data());
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};


const postEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const doc = snapshot.docs[0];
    return res.status(200).json({ vendorId: doc.id, data: doc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports={
    adduser,
    loginuser,
    getCurrentUser,
    postEmail
}