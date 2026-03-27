const {db}=require('../config/firebase_config');

const insertNewPayment=async ({payment_id,ticket_id,user_id,payment_method,amount_paid,payment_status,transaction_id,payment_time})=>{
    try{
        const payment_ref=db.collection('payments').doc(payment_id);
        await payment_ref.set({ticket_id,user_id,payment_method,amount_paid,payment_status,transaction_id,payment_time});
            return 200;
    } catch(err){
            return 500;
    }
}

module.exports={
    insertNewPayment
}