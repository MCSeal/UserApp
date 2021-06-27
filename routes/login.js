const express = require('express');
const loginController = require('../controllers/login')
const router = express.Router();



router.get('/signup', loginController.getSignup);

router.post('/signup', loginController.postSignup);

router.get('/', loginController.getLogin);
router.post('/login', loginController.postLogin);

module.exports = router;