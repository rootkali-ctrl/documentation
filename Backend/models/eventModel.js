const { db } = require('../config/firebase_config');

// const insertNewEvent = async ({ eventId, eventName, category, price, time, tags, description, state, city, venueName, streetName, Tickets, area, pincode, googleMapLink, bannerImages, eventDate, duration, faqs, features,
//     add_ons,
//     coupons,
//     iscancellationavailable,
//     cancellationwindow,
//     refundamount,
//     total_tickets
//  }) => {
//     try {
//         const vendorRef = db.collection('events').doc(eventId);
//         await vendorRef.set({
//             eventId, authId, eventName, category, timeZone, price, time, tags, description, state, city, venueName, streetName, Tickets, area, pincode, googleMapLink, bannerImages, eventDate, duration, faqs, features,
//             add_ons,
//             coupons,
//             iscancellationavailable,
//             cancellationwindow,
//             refundamount,
//             total_tickets
//         });
//         console.log(New event has been inserted into database with eventId : ${eventId} and name : ${eventName});
//         return 200;
//     }
//     catch (err) {
//         console.log(err);
//         return 500;
//     }
// };

const insertNewEvent = async ({
    eventId,
    name,
    description,
    bannerImages,
    category,
    eventDate,
    eventHost,
    mediaLink,
    speaker,
    venueDetails,
    pricing,
    perks,
    coupons,
    contact,
    FAQ,
    ticketCount,
    tags,
    cancellationAvailable,
    cancellationDays,
    deductionType,
    deductionRate,
    vendorId,
    createdAt
}) => {
    try {
        const eventRef = db.collection('events').doc(eventId);

        const eventData = {
            eventId,
            name: name || "",
            createdAt: createdAt || "",
            description: description || "",
            bannerImages: Array.isArray(bannerImages) ? bannerImages : [],
            category: Array.isArray(category) ? category : [],
            eventDate: eventDate || "",
            eventHost: eventHost || "",
            mediaLink: mediaLink || "",
            speaker: Array.isArray(speaker) ? speaker.map(spk => ({
                name: spk.name || "",
                role: spk.role || ""
            })) : [],
            venueDetails: {
                venueName: venueDetails?.venueName || "",
                streetName: venueDetails?.streetName || "",
                area: venueDetails?.area || "",
                city: venueDetails?.city || "",
                pincode: venueDetails?.pincode || "",
                state: venueDetails?.state || ""
            },
            pricing: Array.isArray(pricing) ? pricing.map(ticket => ({
                ticketType: ticket.ticketType || "",
                features: ticket.features || "",
                price: ticket.price || 0,
                tax: ticket.tax || 0,
                free: !!ticket.free,
                seats: ticket.seats || 0
            })) : [],
            perks: Array.isArray(perks) ? perks.map(perk => ({
                itemName: perk.itemName || "",
                price: perk.price || 0,
                limit: perk.limit || 0,
                url: perk.url || 0
            })) : [],
            coupons: Array.isArray(coupons) ? coupons.map(coupon => ({
                couponCode: coupon.couponCode || "",
                couponLimits: coupon.couponLimits || 0,
                endTime: coupon.endTime || "",
                reducePert: coupon.reducePert || 0,
                startTime: coupon.startTime || ""
            })) : [],
            contact: contact || "",
            FAQ: Array.isArray(FAQ) ? FAQ.map(faq => ({
                question: faq.question || "",
                answer: faq.answer || ""
            })) : [],
            tags: tags || "",
            ticketCount: ticketCount || "",
            cancellationAvailable: cancellationAvailable || false,
            cancellationDays: cancellationDays || 0,
            deductionType: deductionType || "",
            deductionRate: deductionRate || 0,
            vendorId: vendorId || ""
        };

        await eventRef.set(eventData);
            return 200;

    } catch (err) {
            return 500;
    }
};


module.exports = {
    insertNewEvent
}