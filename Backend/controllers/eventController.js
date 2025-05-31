

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