const {db}=require('../config/firebase_config');

const insertNewCoupon=async ({coupon_id,event_id,code,discount_percent,max_redemptions,expiry_date})=>{
    try{
        const coupon_ref=db.collection('coupons').doc(coupon_id);
        await coupon_ref.set({event_id,code,discount_percent,max_redemptions,expiry_date});
        console.log(`A new coupon has been inserted with coupon id :${coupon_id} for event ${event_id}`);
        return 200;
    } catch(err){
        console.log(err);
        return 500;
    }
}

module.exports={
    insertNewCoupon
}