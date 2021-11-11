
const User = require('../models/user');
const Post = require('../models/post');
const bcrypt = require('bcryptjs');
const SENDGRID_API_KEY = require('../private/sendgridkey') || 'aliens';
const crypto = require('crypto');


// //mailing services:
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { getMaxListeners } = require('../models/user');
const {validationResult} = require('express-validator/check');



//email stuff
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
      api_key: SENDGRID_API_KEY
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

exports.getFeed = (req, res, next) => {
    let eMessage = req.flash('error')
    
    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }

    Post.find()
    .then(posts => {
        
        res.render('Feed', {
            pageTitle: 'Feed',
            path: '/feed',
            posts: posts,
            isLoggedIn: req.session.isLoggedIn ,
            errorMessage: eMessage,
            oldInput:{
                email:''
            }
        })
    })

};

exports.getThread = (req, res, next) => {
    const postId = req.params.postId;
    let eMessage = req.flash('error')
    
    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }

    Post.findById(postId)
    .then(post => {
        
        res.render('Thread', {
            pageTitle: post.title,
            path: '/thread',
            post: post,
            replies: post.replies,
            isLoggedIn: req.session.isLoggedIn ,
            errorMessage: eMessage,
            oldInput:{
                email:''
            }
        })
    })

};
exports.getNewPost = (req, res, next) => {
    if (!req.session.isLoggedIn){
        return res.redirect('/')
    }

    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }


    res.render('newpost', {
        pageTitle: 'New Post',
        path: '/newpost',
        isLoggedIn: req.session.isLoggedIn ,
        errorMessage: eMessage,
        oldInput:{
            email:''
        }
    })
};

exports.PostNewPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content
    
    
    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        //error handling
    }

    const post = new Post({
        title: title,
        content: content,
        replies: [],
        username: req.user.username,
        userId: req.user
        
    });
    post.save().then(result => {
        
        res.redirect('/feed')
        
    })
};

exports.getNewReply = (req, res, next) => {
    const postId = req.params.postId;

    if (!req.session.isLoggedIn){
        return res.redirect('/')
    }

    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }
    
    res.render('reply', {
        pageTitle: 'New Reply',
        path: '/reply',
        isLoggedIn: req.session.isLoggedIn ,
        errorMessage: eMessage,
        id: postId,
        oldInput:{}
    })
};

exports.postNewReply = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content
    const postId = req.body.postId;



    if (!req.session.isLoggedIn){
        return res.redirect('/')
    }

    let eMessage = req.flash('error')

    if (eMessage.length > 0){
        eMessage = eMessage[0];
    } else {
        eMessage = null;
    }
  
    
    Post.findById(postId)
    .then(post => {
        if (!post){
            return res.redirect('/feed'); 
         }
        post.replies.push({
            title: title,
            content: content,
            username: req.user.username,
            userId: req.user
        })
        return post.save().then(result => {
            console.log(post);
            res.redirect('/thread/' + postId)
            
        })
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
                req.session.isLoggedIn = true;
                req.session.user = foundUser;
                return req.session.save((err) => {
                    res.redirect('/feed');
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
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error);
    });
}


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    //validation
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.log(username)
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
            password: encryptPassword,
            username: username,
        });
        return user.save()
    })
    .then(result => {
        res.redirect('/');
        return transporter.sendMail({
            to: email,
            from: 'mathewcseal@gmail.com',
            subject: 'Thanks for signing-up!',
            html: 

            `
            
                <h1>Thank you ${username} for taking a look at my user-app demo!<h1>
            
            `
        });
    })

    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error);
    });
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
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error);
        });
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
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error);
    });


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
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error);
    });

};


//errors

exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        pageTitle: 'Page Not found',
        path: '/404',
        isLoggedIn: req.session.isLoggedIn
     });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500',
        isLoggedIn: req.session.isLoggedIn
    });
};