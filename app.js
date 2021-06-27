const express = require('express');
const bodyParser = require('body-parser')
const path = require('path')
const keys = require('./private/keys')


//mongoose 
const mongoose = require('mongoose');
//session for cookies... more in authroutes/controller
const session = require('express-session');
//this is seperate package connects session to mongodb
const MongoDBStore = require('connect-mongodb-session')(session);


const MONGODB_CREDS = keys.MONGODB


const app = express();


const store = new MongoDBStore({
    uri: MONGODB_CREDS,
    collection: 'sessions'
})



app.set('view engine', 'ejs');
app.set('views', 'views');
const loginRoutes = require('./routes/login')

app.use(bodyParser.urlencoded({extended: false}));

//for css
app.use(express.static(path.join(__dirname, 'public')));

app.use(loginRoutes)


mongoose.connect(MONGODB_CREDS)
.then(result => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});