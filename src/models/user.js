const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    email: {type: String, required: true, unique: true},
    account : {
        username: {type: String, required: true, unique: true},
        avatar: {type: Object},
    },
    newsletter: {type: Boolean, default: false},
    token: {type: String, required: true},
    hash: {type: String, required: true},
    salt: {type: String, required: true}
})

module.exports = mongoose.model('User', UserSchema);