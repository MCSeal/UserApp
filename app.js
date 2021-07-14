const express = require('express');
const bodyParser = require('body-parser')
const path = require('path')

//messaging flashing
const flash = require('connect-flash');

//mongoose 
const mongoose = require('mongoose');
//session for cookies... more in authroutes/controller
const session = require('express-session');
//this is seperate package connects session to mongodb
const MongoDBStore = require('connect-mongodb-session')(session);

//for 404/500 page
const loginController = require('./controllers/login')

const MONGODB_CREDS = keys.MONGODB


const app = express();


const userApp = new MongoDBStore({
    uri: `${process.env.MONGO}`,
    collection: 'sessions'
})



//to add: validation, 405 error, other stuff?




app.set('view engine', 'ejs');
app.set('views', 'views');
const loginRoutes = require('./routes/login')

app.use(bodyParser.urlencoded({extended: false}));

//for css
app.use(express.static(path.join(__dirname, 'public')));
//middle ware for sessions

app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        store: userApp 
    })
);

app.use(flash());
app.use(loginRoutes);


//500 error page
app.get('/500', loginController.get500);

//this is the 404 page, 
app.use(loginController.get404);


app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isLoggedIn: req.session.isLoggedIn 
    });
});




mongoose.connect(`${process.env.MONGO}`)
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    console.log(err);
});