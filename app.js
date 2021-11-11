const express = require('express');
const bodyParser = require('body-parser')
const path = require('path')
MONGO_API_KEY = process.env.MONGO_API_KEY || require('./private/mongokey');
SECRET_KEY = process.env.SECRET_KEY || require('./private/secret');

//messaging flashing
const flash = require('connect-flash');

//mongoose 
const mongoose = require('mongoose');
//session for cookies... more in authroutes/controller
const session = require('express-session');
//this is seperate package connects session to mongodb
const MongoDBStore = require('connect-mongodb-session')(session);

const User = require('./models/user');

//for 404/500 page
const loginController = require('./controllers/login')

const MONGODB_CREDS = MONGO_API_KEY


const app = express();



const userApp = new MongoDBStore({
    uri: MONGODB_CREDS,
    collection: 'sessions'
})



app.use(
    session({
        secret: SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        store: userApp 
    })
);


//middleware to store/access user from outside this file
//npm start does not run the middle ware functions such as these
app.use((req, res, next) =>{
    if (!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user =>{
       if (!user){
           console.log('no user')
           return next();
       }
       console.log(req.user)
        req.user = user;
        next();
    })
    .catch(err => {
        //inside async you need to use this way to throw error
        next(new Error(err));
    })
});


app.set('view engine', 'ejs');
app.set('views', 'views');
const loginRoutes = require('./routes/login')

app.use(bodyParser.urlencoded({extended: false}));

//for css
app.use(express.static(path.join(__dirname, 'public')));
//middle ware for sessions


app.use(flash());
app.use(loginRoutes);


// //500 error page
// app.get('/500', loginController.get500);

// //this is the 404 page, 
// app.use(loginController.get404);


// app.use((error, req, res, next) => {
//     res.status(500).render('500', {
//         pageTitle: 'Error!',
//         path: '/500',
//         isLoggedIn: req.session.isLoggedIn 
//     });
// });




mongoose.connect(MONGODB_CREDS)
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    console.log(err);
});