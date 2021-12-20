const mongoose = require('mongoose');
const products = require('./products');
const chats = require('./chats');

const usersSchema = mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true
    },
    password:{
        type: String,
        required:true
    },
    phone:{
        type: String,
        required:true
    },
    cart:[{
        // type: String
        type: mongoose.Schema.Types.ObjectId, ref: 'products' 
    }],
    chatList:[{
        
        receiverId:{
            type: mongoose.Schema.Types.ObjectId, ref: 'users' 
        },
        receiverEmail:{
            type: String
        },
        chatId:{
            type: mongoose.Schema.Types.ObjectId, ref: 'chats'
        }
    }],
    socketId: {
        type: String,
        default: undefined
    }
    ,
    college:{
        type: String,
        default: 'N/A'
    },
    branch:{
        type: String,
        default: 'N/A'
    },
    bio:{
        type: String,
        default: "sophomore here"
    },
    coverPic:{
        type: String,
        default: ""
    },
    displayPic:{
        type: String,
        default: ""
    }
});
const users= mongoose.model('users', usersSchema);
module.exports = users;