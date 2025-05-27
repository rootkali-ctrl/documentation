// const {db}=require('../config/firebase_config');

// const insertNewVendor=async ({authId,username,password,phoneNumber,panNumber,aadharNumber,IFSC_Code,document,email})=>{
//     try{
//         const vendorRef=db.collection('vendors').doc(authId);
//         await vendorRef.set({username,password,phoneNumber,panNumber,aadharNumber,IFSC_Code,document,email});
//         console.log(`New vendor has been inserted into database with authId : ${authId} and name : ${username}`);
//         return 200;
//     }
//     catch(err){
//         console.log(err);
//         return 500;
//     }
// };

// module.exports={
//     insertNewVendor
// }

const { db } = require('../config/firebase_config');

// Updated insertNewVendor function to handle only text data
const insertNewVendor = async ({
  authId,
  username,
  password,
  email,
  organisationType,
  organisationName,
  organisationMail,
  organisationContact,
  GSTIN,
  panNumber,
  aadharNumber,
  AccountNumber,
  IFSCNumber,
  lastLogin,
  createdAt,
  documents 
}) => {
  try {
    const vendorRef = db.collection('vendors').doc(authId);
    
    await vendorRef.set({
      username,
      password,
      email,
      organisationType,
      organisationName,
      organisationMail,
      organisationContact,
      GSTIN,
      panNumber,
      aadharNumber,
      AccountNumber,
      IFSCNumber,
      lastLogin,
      status: false, // status will be set to pending by default
      createdAt,
      documents 
    });

    console.log(`New vendor has been inserted into database with authId: ${authId} and name: ${username}`);
    return 200;
  } catch (err) {
    console.log(err);
    return 500;
  }
};

module.exports = {
  insertNewVendor
};
