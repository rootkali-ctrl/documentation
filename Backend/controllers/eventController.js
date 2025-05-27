// const { insertNewEvent } = require('../models/eventModel');
// const { db } = require('../config/firebase_config');

// // const addEvent = async (req, res) => {
// //     try {
// //         const { eventId,
// //             authId,
// //             eventName,
// //             category,
// //             timeZone,
// //             vip_ticket_price,
// //             regular_ticket_price,
// //             children_ticket_price,
// //             time,
// //             tags,
// //             description,
// //             state,
// //             city,
// //             venueName,
// //             streetName,
// //             vip_ticket_count,
// //             regular_ticket_count,
// //             children_ticket_count,
// //             area,
// //             pincode,
// //             googleMapLink,
// //             eventDate,
// //             duration,
// //             faqs,
// //             features,
// //             add_ons,
// //             coupons,
// //             iscancellationavailable,
// //             cancellationwindow,
// //             refundamount
// //          } = req.body;

// //          // the structure of the coupons is {
// //          // startDate,
// //          // endDate,
// //          // usageLimit
// //          // }

// //         const bannerImages = req.files.map(file => file.buffer.toString("base64"));
// //         const price={
// //             vip_ticket_price,
// //             regular_ticket_price,
// //             children_ticket_price
// //         }
// //         const Tickets={
// //             vip_ticket_count,
// //             regular_ticket_count,
// //             children_ticket_count,
// //         }
// //         const eventDetails = {
// //             bannerImages,
// //             eventName,
// //             eventId,
// //             authId,
// //             category,
// //             tags,
// //             time,
// //             timeZone,
// //             description,
// //             state,
// //             city,
// //             streetName,
// //             venueName,
// //             price,
// //             Tickets,
// //             area,
// //             pincode,
// //             googleMapLink: googleMapLink,
// //             eventDate,
// //             duration,
// //             faqs,
// //             features,
// //             add_ons,
// //             coupons,
// //             iscancellationavailable,
// //             cancellationwindow,
// //             refundamount,
// //             total_tickets:Tickets
// //         }
// //         const code = await insertNewEvent(eventDetails);
// //         if (code == 200) {
// //             return res.status(201).json({ Message: "New Event added" });
// //         }
// //         else {
// //             return res.status(500).json({ Message: "Error adding Event" });
// //         }
// //     }
// //     catch (err) {
// //         console.log(err);
// //         res.status(500).json({ Error: err });
// //     }
// // };


// const getAllEvents = async (req, res) => {
//     try {
//         const eventRef = db.collection('events');
//         const snapshot = await eventRef.get();
//         const eventJson = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data()
//         }));
//         res.status(200).json({ Events: eventJson });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ Error: err.message });
//     }
// };

// //Code added by harish for testing purpose
// const addEvent = async (req, res) => {
//     try {
//       const { eventDetails, finalSetup, pricing } = req.body;

//       const {
//         name,
//         description,
//         category,
//         eventDate,
//         eventHost,
//         mediaLink,
//         speaker,
//         banner,
//         vendorId,
//         venueDetails
//       } = eventDetails;

//       const { contact, tags, FAQ } = finalSetup;
//       const { tickets, addons, coupons } = pricing;

//       const eventPayload = {
//         name,
//         description,
//         category,
//         eventDate,
//         eventHost,
//         mediaLink,
//         speaker,
//         banner, // assume already base64 if images
//         vendorId,
//         venueDetails,
//         pricing: {
//           tickets,
//           addons,
//           coupons
//         },
//         finalSetup: {
//           contact,
//           tags,
//           FAQ
//         },
//         createdAt: new Date().toISOString()
//       };

//       const code = await insertNewEvent(eventPayload);
//       if (code === 200) {
//         return res.status(201).json({ message: "Event added successfully" });
//       } else {
//         return res.status(500).json({ message: "Error adding event" });
//       }
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: err.message });
//     }
//   };



// module.exports = {
//     addEvent,
//     getAllEvents
// }




// const addEvent = async (req, res) => {
//     try {
//         const eventId = uuidv4();
//         console.log("Incoming data:", req.body);

//         const parseIfJson = (val) => {
//             try {
//               return typeof val === "string" ? JSON.parse(val) : val;
//             } catch {
//               return val;
//             }
//           };

//         let {
//             name,
//             description,
//             category,
//             eventDate,
//             eventHost,
//             mediaLink,
//             speaker,
//             venueDetails,
//             pricing,
//             perks,
//             coupons,
//             contact,
//             FAQ,
//             tags,
//             cancellationAvailable,
//             cancellationDays,
//             deductionType,
//             deductionRate,
//             vendorId,
//             createdAt
//         } = req.body;

//         const bannerImages = req.files ? req.files.map(file => file.buffer.toString("base64")) : [];

//         // Default values
//         mediaLink = mediaLink || "";
//         speaker = Array.isArray(speaker) ? speaker.map(spk => ({
//             name: spk.name || "",
//             role: spk.role || "",
//         })) : [];

//         perks = Array.isArray(perks) ? perks.map(perk => ({
//             itemName: perk.itemName || "",
//             price: perk.price || 0,
//             limit: perk.limit || 0
//         })) : [];

//         coupons = Array.isArray(coupons) ? coupons.map(coupon => ({
//             couponCode: coupon.couponCode || "",
//             couponLimits: coupon.couponLimits|| 0,
//             endTime: coupon.endTime || "",
//             reducePert: coupon.reducePert || 0,
//             startTime: coupon.startTime || "",
//         })) : [];

//         FAQ = Array.isArray(FAQ) ? FAQ.map(faq => ({
//             question: faq.question || "",
//             answer: faq.answer || ""
//         })) : [];


//         venueDetails = venueDetails || {
//             venueName: "",
//             streetName: "",
//             area: "",
//             city: "",
//             pincode: "",
//             state: "",
//         };

//         pricing = Array.isArray(pricing) ? pricing.map(ticket => ({
//             ticketType: ticket.ticketType || "",
//             features: ticket.features || "",
//             price: ticket.price || 0,
//             tax: ticket.tax || 0,
//             free: !!ticket.free,
//             seats: ticket.seats || 0
//         })) : [];

//         const eventData = {
//             name,
//             eventId,
//             description,
//             category: parseIfJson(req.body.category),
//             eventDate,
//             eventHost,
//             mediaLink,
//             vendorId,
//             speaker: parseIfJson(req.body.speaker),
//             venueDetails: parseIfJson(req.body.venueDetails),
//             pricing: parseIfJson(req.body.pricing),
//             perks: parseIfJson(req.body.perks),
//             coupons: parseIfJson(req.body.coupons),
//             contact,
//             FAQ: parseIfJson(req.body.FAQ),
//             tags,
//             cancellationAvailable,
//             cancellationDays,
//             deductionType,
//             deductionRate,
//             createdAt
//           };
//           console.log("Parsed event data:", eventData);


//         const code = await insertNewEvent(eventData);

//         if (code === 200) {
//             return res.status(201).json({ message: "New event added successfully", eventId });
//         } else {
//             return res.status(500).json({ message: "Error adding event" });
//         }
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// };


const { insertNewEvent } = require('../models/eventModel');
const { db, bucket} = require('../config/firebase_config');
const { v4: uuidv4 } = require('uuid');

const addEvent = async (req, res) => {
  try {
    const eventId = uuidv4();
    const bannerImages = [];

    // 1. Upload each file to Firebase Storage
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `events/${eventId}/banner_${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", reject);
          blobStream.on("finish", async () => {
            try {
              await fileUpload.makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

              bannerImages.push(publicUrl);

              resolve();
            } catch (err) {
              reject(err);
            }
          });
          blobStream.end(file.buffer);
        });
      }
    }

    const parseIfJson = (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    };

    const {
      name, description, category, eventDate, eventHost, mediaLink,
      speaker, venueDetails, pricing, perks, coupons, contact,
      FAQ, tags, cancellationAvailable, cancellationDays, deductionType,
      deductionRate, vendorId, createdAt, ticketCount
    } = req.body;

    const eventData = {
      eventId,
      name,
      description,
      bannerImages,
      category: parseIfJson(category),
      eventDate,
      eventHost,
      mediaLink,
      speaker: parseIfJson(speaker),
      venueDetails: parseIfJson(venueDetails),
      pricing: parseIfJson(pricing),
      perks: parseIfJson(perks),
      coupons: parseIfJson(coupons),
      contact,
      FAQ: parseIfJson(FAQ),
      ticketCount,
      tags,
      cancellationAvailable,
      cancellationDays,
      deductionType,
      deductionRate,
      vendorId,
      createdAt,
    };

    // 4. Store in Firestore
    const code = await insertNewEvent(eventData);
    return res.status(code === 200 ? 201 : 500).json({
      message: code === 200 ? "New event added successfully" : "Error adding event",
      eventId,
    });

  } catch (err) {
    console.log("Event upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getAllEvents = async (req, res) => {
    try {
        const eventRef = db.collection('events');
        const snapshot = await eventRef.get();
        const events = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json({ events });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventDoc = await db.collection('events').doc(eventId).get();

        if (!eventDoc.exists) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ event: eventDoc.data() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getEventsByVendor = async (req, res) => {
    try {
      const { vendorId } = req.params;
      if (!vendorId) {
        return res.status(400).json({ error: "vendorId is required" });
      }

      const eventRef = db.collection("events");
      const snapshot = await eventRef.where("vendorId", "==", vendorId).get();

      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(events); // return directly the array
    } catch (err) {
      console.error("Error fetching vendor events:", err);
      res.status(500).json({ error: err.message });
    }
  };

const deleteEvent = async (req, res) => {
  try{
    const {eventId} = req.params;
    if(!eventId){
      return res.status(400).json({error: "Event id is required"})
    }
    const eventRef = db.collection("events").doc(eventId);
    const doc = await eventRef.get();

    if(!doc.exists){
      return res.status(400).json({error: "Event does not exist"})
    }
    await eventRef.delete();
    return res.status(200).json({message: "Event deleted successfully"})
  } catch(err) {
    console.log("Error in deleting event", err);
    res.status(500).json({error: err.message})
  }
  
}

module.exports = {
    addEvent,
    getAllEvents,
    getEventById,
    getEventsByVendor,
    deleteEvent
};