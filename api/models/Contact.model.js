const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    company : {
        type : String,
    },
    role : {
        type : String
    },
    email : {
        type : String,
    },
    notes : {
        type : String,
    },
    metaData : {
        type : Map,
        of : String,
    },
    metadataText : {
        type : String,
    },
    created_at : {
        type : Date,
        default : Date.now,
    }
}, {timestamps : true});

const contact = mongoose.model("Contacts",contactSchema);
module.exports = contact;