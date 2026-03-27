const {db}=require('../config/firebase_config');

const insertNewTicket=async ({ticket_id,event_id,user_id,ticket_price,discount_applied,payment_status,qr_code,booking_time,tickets,payment_id})=>{
    try{
        const ticket_ref=db.listCollections('tickets').doc(ticket_id);
        await ticket_ref.set({event_id,user_id,ticket_price,discount_applied,payment_status,qr_code,booking_time,tickets,payment_id});
            return 200;
    } catch(err) {
            return 500;
    }
}

module.exports={
    insertNewTicket
}