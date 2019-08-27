
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    profileUrl: {
        type: String,
        required: false,
        unique: false
    },
    id: {
        type: String,
        required: true,
        unique: true
      },
      followers: {
        type: Number,
        required: false,
        unique: false
      },
      access_token: {
          type: String,
          required: false,
          unique: false
      },
      refresh_token: {
        type: String,
        required: false,
        unique: false
    }
}, { timestamps: true });




const User = mongoose.model('User', userSchema);

module.exports = User;
