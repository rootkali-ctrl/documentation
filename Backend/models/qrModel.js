const {db}=require('../config/firebase_config');

const insertNewQr=async ({qr_code_id,ticket_id,qr_data,status})=>{
    try {
        const qr_ref=db.collection('qr_codes').doc(qr_code_id);
        await qr_ref.set({ticket_id,qr_data,status});
        console.log(`A new qr has been inserted with id ${qr_code_id}`);
        return 200;
    } catch(err) {
        console.log(err);
        return 500;
    }
}

module.exports={
    insertNewQr
}