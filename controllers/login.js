
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const keys = require('../private/keys');
// //validation
// const { validationResult } = require('express-validator/check')
// //mailing services:
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { getMaxListeners } = require('../models/user');




//email stuff
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
      api_key: keys.SENDGRID
    }
  }));
  
  

exports.getLogin = (req, res, next) => {
    res.render('login', {
        pageTitle: 'Login',
        path: '/'
    })
};

exports.getSignup = (req, res, next) => {
    res.render('signup', {
        pageTitle: 'Signup',
        path: '/signup'
    })

}



exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email:email})
    .then(foundUser => {
        if (!foundUser){
            console.log('munkey')
        }
        bcrypt.compare(password, foundUser.password).then(match => {
            console.log('success!')
            res.redirect('/');
        })


    })
    .catch(err => {
        console.log(err);
        res.redirect('/')
      })
}


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    console.log(email + password + confirmPassword)
    bcrypt.hash(password, 12)
    .then(encryptPassword => {
        const user = new User({
            email: email,
            password: encryptPassword
        });
        return user.save()
    })
    .then(result => {
        res.redirect('/');
        return transporter.sendMail({
            to: email,
            from: 'mathewcseal@gmail.com',
            subject: 'Thanks for signing-up!',
            html: '<h1>Thank you for taking a look at my user-app demo!<h1>'
        });
    })


    .catch(err => {
        console.log(err)
    })
}