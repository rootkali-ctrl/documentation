const { db } = require('../config/firebase_config');
const { v4: uuid } = require("uuid");

const getAllTickets = async (req, res) => {
  try {
    const user_id = req.params.userId;
    const ticketsSnapshot = await db.collection('tickets').where('userId', '==', user_id).get();

    if (ticketsSnapshot.empty) {
      return res.status(404).json({ message: 'No tickets found for this user.' });
    }

    const tickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ Tickets: tickets });
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ Error: err.message });
  }
};

const ticketForEventBooking = async (req, res) => {
  try {
    const {
      event_id,
      user_id,
      tickets,
      discount_applied,
      payment_status,
      qr_code,
      ticket_price,
      booking_time,
      payment_id,
    } = req.body;

    if (!event_id || !user_id || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ Error: "Invalid request data" });
    }

    const eventRef = db.collection('events').doc(event_id);
    const ticketId = uuid();
    let ticketDetails;
    let eventData;

    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      eventData = eventDoc.data();
      const pricing = eventData.pricing || [];

      // Initialize 'booked' field if it doesn't exist for backward compatibility
      const updatedPricing = pricing.map(p => ({
        ...p,
        booked: p.booked || 0,
        available: p.available !== undefined ? p.available : (p.seats - (p.booked || 0))
      }));

      // Validate ticket availability for each ticket type
      for (const ticket of tickets) {
        const pricingEntry = updatedPricing.find(p => p.ticketType === ticket.type);
        if (!pricingEntry) {
          throw new Error(`Ticket type ${ticket.type} not found`);
        }

        // Check availability using the available field
        if (pricingEntry.available < ticket.quantity) {
          throw new Error(
            `Not enough seats for ${ticket.type}. Available: ${pricingEntry.available}, Requested: ${ticket.quantity}`
          );
        }
      }

      // Calculate total tickets being booked
      const totalTicketsBeingBooked = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

      // Update the pricing array with new booked counts and available counts
      for (const ticket of tickets) {
        const pricingEntry = updatedPricing.find(p => p.ticketType === ticket.type);
        pricingEntry.booked = (pricingEntry.booked || 0) + ticket.quantity;
        pricingEntry.available = pricingEntry.available - ticket.quantity;
      }

      // Update the overall ticketBookedCount
      const currentTicketBookedCount = eventData.ticketBookedCount || 0;
      const newTicketBookedCount = currentTicketBookedCount + totalTicketsBeingBooked;

      // Calculate total available tickets across all types
      const totalAvailableTickets = updatedPricing.reduce((sum, p) => sum + p.available, 0);

      // Update event document with new counts
      transaction.update(eventRef, {
        pricing: updatedPricing,
        ticketBookedCount: newTicketBookedCount,
        totalAvailableTickets: totalAvailableTickets,
        lastBookingUpdate: new Date().toISOString()
      });

      // Prepare ticket details
      ticketDetails = {
        event_id,
        user_id,
        tickets: tickets.map(t => ({
          type: t.type,
          quantity: t.quantity,
          price: t.price,
          subtotal: t.quantity * t.price,
        })),
        discount_applied,
        payment_status,
        qr_code,
        ticket_price,
        booking_time,
        ticket_id: ticketId,
        payment_id,
        createdAt: new Date().toISOString(),
        bookingStatus: 'confirmed'
      };

      // Save ticket to the tickets collection
      const ticketRef = db.collection('tickets').doc(qr_code.replace("#", ""));
      transaction.set(ticketRef, ticketDetails);

      // Save ticket to user's tickets subcollection
      const userTicketRef = db.collection('users').doc(user_id).collection('tickets').doc(qr_code.replace("#", ""));
      transaction.set(userTicketRef, {
        ticketId: qr_code.replace("#", ""),
        eventId: event_id,
        eventName: eventData.name || "Event",
        bookingDate: booking_time,
        status: "active",
        ticketCount: totalTicketsBeingBooked,
        ticketTypes: tickets.map(t => `${t.type} (${t.quantity})`).join(', ')
      });
    });

    // Return success response with updated ticket information
    return res.status(201).json({
      Message: "Event has been booked and tickets are generated",
      ticketId: ticketId,
      bookingDetails: {
        totalTicketsBooked: tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
        ticketTypes: tickets.map(t => ({ type: t.type, quantity: t.quantity })),
        eventName: eventData.name,
        bookingId: qr_code
      }
    });
  } catch (err) {
    console.error("Error in ticketForEventBooking:", err);
    res.status(500).json({ Error: err.message });
  }
};

// New function to get current ticket availability for an event
const getEventTicketAvailability = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ Error: "Event not found" });
    }

    const eventData = eventDoc.data();
    const pricing = eventData.pricing || [];

    const ticketAvailability = pricing.map(ticket => ({
      ticketType: ticket.ticketType,
      totalSeats: ticket.seats,
      bookedSeats: ticket.booked || 0,
      availableSeats: ticket.available !== undefined ? ticket.available : (ticket.seats - (ticket.booked || 0)),
      price: ticket.price,
      features: ticket.features,
      isSoldOut: (ticket.available !== undefined ? ticket.available : (ticket.seats - (ticket.booked || 0))) <= 0
    }));

    const totalSeats = pricing.reduce((sum, p) => sum + p.seats, 0);
    const totalBooked = eventData.ticketBookedCount || 0;
    const totalAvailable = eventData.totalAvailableTickets !== undefined
      ? eventData.totalAvailableTickets
      : totalSeats - totalBooked;

    res.status(200).json({
      eventId: eventId,
      eventName: eventData.name,
      totalSeats: totalSeats,
      totalBookedTickets: totalBooked,
      totalAvailableTickets: totalAvailable,
      ticketTypes: ticketAvailability,
      isEventSoldOut: totalAvailable <= 0
    });
  } catch (err) {
    console.error("Error fetching ticket availability:", err);
    res.status(500).json({ Error: err.message });
  }
};

module.exports = {
  getAllTickets,
  ticketForEventBooking,
  getEventTicketAvailability
};