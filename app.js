const express = require('express');
const bodyParser = require('body-parser')
const path = require('path')
const keys = require('./private/keys')
//messaging flashing
const flash = require('connect-flash');

//mongoose 
const mongoose = require('mongoose');
//session for cookies... more in authroutes/controller
const session = require('express-session');
//this is seperate package connects session to mongodb
const MongoDBStore = require('connect-mongodb-session')(session);


const MONGODB_CREDS = keys.MONGODB


const app = express();


const userApp = new MongoDBStore({
    uri: MONGODB_CREDS,
    collection: 'sessions'
})



//to add: validation, 405 error, other stuff?
//

app.set('view engine', 'ejs');
app.set('views', 'views');
const loginRoutes = require('./routes/login')

app.use(bodyParser.urlencoded({extended: false}));

//for css
app.use(express.static(path.join(__dirname, 'public')));
//middle ware for sessions

app.use(
    session({
        secret:keys.SECRET,
        resave: false,
        saveUninitialized: false,
        store: userApp 
    })
);

app.use(flash());
app.use(loginRoutes);


mongoose.connect(MONGODB_CREDS)
.then(result => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});