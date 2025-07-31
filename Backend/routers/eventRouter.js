const upload = require("multer")();
const Router = require("express").Router()
const {
    addEvent,
    getAllEvents,
    getEventsByVendor,
    deleteEvent
  } = require('../controllers/eventController');

  Router.get('/allevents', getAllEvents);
  Router.get('/vendor/:vendorId', getEventsByVendor);
  Router.post('/', upload.array("bannerImages", 9), addEvent);
  Router.delete("/:eventId", deleteEvent)
  
module.exports = Router;