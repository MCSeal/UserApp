const express = require('express');
const loginController = require('../controllers/login')
const router = express.Router();



router.get('/signup', loginController.getSignup);

router.post('/signup', loginController.postSignup);

router.get('/', loginController.getLogin);
router.post('/login', loginController.postLogin);

router.post('/logout', loginController.postLogout)


router.get('/reset', loginController.getReset);

router.post('/reset', loginController.postReset);



router.get('/reset/:key', loginController.getNewPassword)

router.post('/new-password', loginController.postNewPassword)

module.exports = router;