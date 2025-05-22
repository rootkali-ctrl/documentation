const e = require('express');
const {db}=require('../config/firebase_config');
const {insertNewTicket}=require('../models/ticketModel');
const {v4:uuid}=require("uuid");
// const { data } = require('react-router-dom');

const getAllTickets = async (req, res) => {
    try {
        const user_id = req.params.userId;
        const ticketsSnapshot = await db.collection('tickets').where('user_id', '==', user_id).get();

        if (ticketsSnapshot.empty) {
            return res.status(404).json({ message: 'No tickets found for this user.' });
        }

        const tickets = ticketsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ Tickets: tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ Error: err.message });
    }
};

const ticketForEventBooking=async (req,res)=>{
    try{
        const {
            event_id,
            user_id,
            tickets,
            discount_applied,
            payment_status,
            qr_code ,
            ticket_price,
            booking_time,payment_id
        }=req.body;


        // sttucture of ticket is :
        // {
        //     vip_ticket_count,
        //     regular_ticket_count,
        //     children_ticket_count
        // }

        // const eventRef=db.collection("events").doc(event_id);


        const ticketDetails={
            event_id,
            user_id,
            tickets,
            discount_applied,
            payment_status,
            qr_code ,
            ticket_price,
            booking_time,
            ticket_id:uuid(),
            payment_id
        }

            try{
                const eventRef=db.collection('events').doc(event_id);
                const currentTicketsLeft=(await eventRef.get()).data()?.Tickets;
                if(!(currentTicketsLeft.vip_ticket_count>=tickets.vip_ticket_count&&currentTicketsLeft.regular_ticket_count>=tickets.regular_ticket_count&&currentTicketsLeft.children_ticket_count>=tickets.children_ticket_count))
                    return res.status(400).json({Error:"The demanded tickets are not available"});

                await eventRef.update({Tickets:{
                    vip_ticket_count:currentTicketsLeft.vip_ticket_count-tickets.vip_ticket_count,
                    regular_ticket_count:currentTicketsLeft.regular_ticket_count-tickets.regular_ticket_count,
                    children_ticket_count:currentTicketsLeft.children_ticket_count-tickets.children_ticket_count
                }});
                const response=await insertNewTicket(ticketDetails);
                if(response!==200) return res.status(400).json({Error:"Incorrect ticket details"});
                return res.status(201).json({Message:"Event has been booked and tickets are generated"});
            }
            catch(err){
                console.log(err);
                return res.status(500).json({Error:err});
            }
        
        
    } catch(err) {
        console.log(err);
        res.status(500).json({Error:err});
    }
};

module.exports={
    getAllTickets,
    ticketForEventBooking
}