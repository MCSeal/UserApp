const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true
    },
    resetKey: String,
    resetKeyExpiration: Date

})

module.exports = mongoose.model('User', userSchema)