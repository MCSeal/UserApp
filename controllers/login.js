
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
    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }


    res.render('login', {
        pageTitle: 'Login',
        path: '/',
        isLoggedIn: req.session.isLoggedIn ,
        errorMessage: eMessage,
        oldInput:{
            email:''
        }
    })
};

exports.getSignup = (req, res, next) => {
    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }
    res.render('signup', {
        pageTitle: 'Signup',
        path: '/signup',
        isLoggedIn: req.session.isLoggedIn,
        errorMessage: eMessage,
        oldInput:{
            email:''
        }
    })

}



exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email:email})
    .then(foundUser => {
        if (!foundUser){
            oldInput: {email:email}
            req.flash('error', 'Incorrect email or password.');
            res.redirect('/');
        }
        bcrypt.compare(password, foundUser.password).then(match => {
            if (match){
                console.log('success!')
                req.session.isLoggedIn = true;
                return req.session.save((err) => {
                    res.redirect('/');
                })
                
            }
            else {
                oldInput: {email:email}
                req.flash('error', 'Incorrect email or password.');
                res.redirect('/');
                console.log('wrong password goober')
            }
        })


    })
    .catch(err => {
        console.log(err);
        
      })
}


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    User.findOne({email:email}).then( foundUser =>{
        if (foundUser){
            oldInput: {email:email}
            req.flash('error', 'Email already in use!.');
            res.redirect('/signup');
        }
    })

    if (password != confirmPassword){
        req.flash('error', 'Passwords need to match.');
        oldInput: {email:email}
        res.redirect('/signup');
    }

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

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
}


// if (!req.session.isLoggedIn) {
//     res.redirect('/')
// }