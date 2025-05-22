const Router=require('express').Router()
const {
    getAllTickets,
    ticketForEventBooking
}=require('../controllers/ticketController')

Router.get('/:userId',getAllTickets);
Router.post('/bookEvent',ticketForEventBooking);


module.exports=Router;