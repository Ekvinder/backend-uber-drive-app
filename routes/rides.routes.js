const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { createRide, getUser_Rides ,getAvailableRides,acceptRide,startRide,completeRide } = require('../controllers/ridesController');


const router = express.Router();

router.post('/', authenticate, createRide);
router.get('/', authenticate, getUser_Rides);
router.get('/available', authenticate, getAvailableRides);
router.post('/:rideId/accept', authenticate, acceptRide);
router.post('/:rideId/start', authenticate, startRide);
router.post('/:rideId/complete', authenticate, completeRide);


module.exports = router;