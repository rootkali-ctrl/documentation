const {db}=require('../config/firebase_config');

const addRegistrationRequest=async ({ requestId,
    username,
    email,
    status,
    organisationType,
    organisationName,
    organisationMail,
    organisationContact,
    GSTIN,
    panNumber,
    aadharNumber,
    AccountNumber,
    IFSCNumber,
    createdAt,
    documents})=>{
    try{
        const registrationRequestRef=db.collection('registration_request').doc(requestId);
        await registrationRequestRef.set({ username,
            email,
            status,
            organisationType,
            organisationName,
            organisationMail,
            organisationContact,
            GSTIN,
            panNumber,
            aadharNumber,
            AccountNumber,
            IFSCNumber,
        createdAt,
        documents});
        console.log("A new registration request has been sent to the admin");
        return 200;
    }
    catch(err){
        console.log(err);
        return 500;
    }
}


module.exports={
    addRegistrationRequest
}