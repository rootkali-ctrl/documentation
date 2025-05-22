const {db}=require('../config/firebase_config');

const insertNewUser=async ({authId,username,firstName,lastName,role,password,image,email,type})=>{
    try{
        const userRef=db.collection('users').doc(authId);
        await userRef.set({username,firstName,lastName,role,password,image,email,type});
        console.log(`New user has been inserted into database with authId : ${authId} and name : ${username}`);
        return 200;
    }
    catch(err){
        console.log(err);
        return 500;
    }
}



module.exports={
    insertNewUser
}