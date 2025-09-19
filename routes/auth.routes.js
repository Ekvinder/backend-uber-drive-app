const express = require('express');
const {signUp,login, getOAuthUrl, getProfile, updateProfile, signupMiddleware} = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware')
const router = express.Router();



router.post('/signup',signupMiddleware,signUp);
router.post('/login',login);
router.get('/oauth/:provider',getOAuthUrl)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);


module.exports = router;