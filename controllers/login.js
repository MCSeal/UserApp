
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const keys = require('../private/keys');
const crypto = require('crypto')
// //validation
// const { validationResult } = require('express-validator/check')
// //mailing services:
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { getMaxListeners } = require('../models/user');
const {validationResult} = require('express-validator/check');



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
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.status(422).render('login', {
            pageTitle: 'Login',
            path: '/',
            isLoggedIn: req.session.isLoggedIn ,
            errorMessage: errors.array()[0].msg,
            oldInput: {email:email}
        });
    }
    let eMessage = req.flash('error')
    User.findOne({email:email})
    .then(foundUser => {
        if (!foundUser){
            return res.status(422).render('login', {
                pageTitle: 'Login',
                path: '/',
                isLoggedIn: req.session.isLoggedIn ,
                errorMessage: 'No account with that Email found.',
                oldInput: {email:email}
            });
        }
        bcrypt.compare(password, foundUser.password).then(match => {
            if (match){
                console.log('success!')
                req.session.isLoggedIn = true;
                return req.session.save((err) => {
                    res.redirect('/');
                })
                
            }
            return res.status(422).render('login', {
                pageTitle: 'Login',
                path: '/',
                isLoggedIn: req.session.isLoggedIn ,
                errorMessage: 'Incorrect email or password.',
                oldInput: {email:email}
            });
        })


    })
    .catch(err => {
        console.log(err);
        
      })
}


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    //validation
    const errors = validationResult(req);
    if (!errors.isEmpty()){
       return res.status(422).render('signup', {
            pageTitle: 'Signup',
            path: '/signup',
            isLoggedIn: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldInput:{email: email}
        })

    }
    bcrypt
    .hash(password, 12)
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



exports.getReset = (req, res, next) => {
    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }
    res.render('reset', {
        path: '/reset',
        isLoggedIn: req.session.isLoggedIn,
        pageTitle: 'Reset Password',
        errorMessage: eMessage
    })
}


exports.postReset = (req, res, next) => {
    userEmail = req.body.email
    crypto.randomBytes(16, (err, buffer) =>{
        if (err) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: userEmail})
        .then(foundUser => {
            if (!foundUser){
                req.flash('error', 'No account with that Email was found.');
                return res.redirect('/reset');
            }
            foundUser.resetKey = token;
            foundUser.resetKeyExpiration = Date.now() + 1800000;
            return foundUser.save();
        })
        .then(result => {
            res.redirect('/');
            transporter.sendMail({
                to: userEmail,
                from: 'mathewcseal@gmail.com',
                subject: 'Password Reset',
                html: `<p>You've requested to reset your email</p>
                <p>click <a href="http://localhost:3000/reset/${token}">here</a> to reset your password</p>
                (This is valid for 30 minutes)
                `
            });
        })
        .catch(err => {
            console.log(err);
        })
    })
}


exports.getNewPassword = (req, res, next) => {
    const key = req.params.key;
  
    User.findOne({resetKey: key, resetKeyExpiration: {$gt: Date.now()}})
    .then(user => {
 
        let eMessage = req.flash('error')

        if (eMessage.length > 0){
            eMessage = eMessage[0];
        } else {
            eMessage = null;
        }
        res.render('new-password', {
            path: '/new-password',
            pageTitle:'Make a new Password',
            isLoggedIn: req.session.isLoggedIn,
            errorMessage: eMessage,
            userId: user._id.toString(),
            passwordKey: key
        })
    })
    .catch(err => {
        console.log(err)
    })


}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordKey= req.body.passwordKey;
    let resetUser;

    User.findOne({
        resetKey: passwordKey,
        resetKeyExpiration: { $gt: Date.now() },
        _id: userId
      })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetKey = undefined;
        resetUser.resetKeyExpiration = undefined;
        return resetUser.save()
    })
    .then(result => {
        res.redirect('/');
        transporter.sendMail({
            to: userEmail,
            from: 'mathewcseal@gmail.com',
            subject: 'Password Reset',
            html: `<p>You've reset your password!</p>`
        });
        
    })
    .catch(err => console.log(err))

};