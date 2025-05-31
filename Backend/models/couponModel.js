const insertNewCoupon = async ({ coupon_id, event_id, code, discount_percent, max_redemptions, expiry_date }) => {
  try {
    const coupon_ref = db.collection('coupons').doc(coupon_id);
    await coupon_ref.set({
      event_id,
      code,
      discount_percent,
      max_redemptions,
      expiry_date,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    });
    console.log(`A new coupon has been inserted with coupon id: ${coupon_id} for event ${event_id}`);
    return 200;
  } catch (err) {
    console.error('Error inserting coupon:', err);
    return 500;
  }
};

module.exports = { insertNewCoupon };