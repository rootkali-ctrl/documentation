const upload = require("multer")();
const Router = require("express").Router()
const {
    addEvent,
    getAllEvents,
    getEventsByVendor
  } = require('../controllers/eventController');

  Router.get('/allevents', getAllEvents);
  Router.get('/vendor/:vendorId', getEventsByVendor);
  Router.post('/', upload.array("bannerImages", 6), addEvent);
  
module.exports = Router;