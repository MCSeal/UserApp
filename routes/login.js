const express = require('express');
const { check, body } = require('express-validator/check')
const loginController = require('../controllers/login')
const router = express.Router();
const User = require('../models/user')


router.get('/signup', loginController.getSignup);

router.post('/signup',
    [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { rec }) => {
            return User.findOne({ email: value })
            .then(userDoc =>{
                if (userDoc){
                    //if find email arleady used
                    return Promise.reject('E-mail already exists, please try a different one.');
                }
            });    
        })
        .normalizeEmail(),
        body('username')
            .isLength({ min: 5 })
            .withMessage('5 character minimum for username.')
            .custom((value, { rec }) => {
                return User.findOne({ username: value })
                .then(userDoc =>{
                    if (userDoc){
                        //if find email arleady used
                        return Promise.reject('Username already taken, please try a different one.');
                    }
                });    
            }),
    body(
        'password',
        'Please enter a password with min 5 characters and that is alphanumeric.'
        )
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
        if (value !== req.body.password){
            throw new Error('Passwords have to match!');
        }
        return true
    })

], loginController.postSignup);

//feed
router.get('/feed', loginController.getFeed);
router.get('/newpost', loginController.getNewPost);
router.post('/newpost', loginController.PostNewPost);

router.get('/reply/:postId', loginController.getNewReply);
router.post('/reply', loginController.postNewReply);

//new stuff 
router.get('/thread/:postId', loginController.getThread);




//Login/Auth Files:
router.get('/', loginController.getLogin);
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid Email.'),
    body('password', 'Please enter a valid Password.')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim()
], loginController.postLogin);

router.post('/logout', loginController.postLogout)

router.get('/reset', loginController.getReset);

router.post('/reset', loginController.postReset);



router.get('/reset/:key', loginController.getNewPassword)

router.post('/new-password', loginController.postNewPassword)

module.exports = router;