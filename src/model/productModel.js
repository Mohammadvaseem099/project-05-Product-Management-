const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    title: {

        type: String,
        required: true,
        unique: true

    },

    description: {

        type: String,
        required: true

    },

    price: {

        type: Number,
        required: true

    },

    currencyId: {

        type: String,
        required: true,
        default: 'INR'
    },

    currencyFormat: {

        type: String,
        required: true,
        default: '₹'

    },

    isFreeShipping: {

        type: Boolean,
        default: false

    },

    productImage: {

        type: String,
        required: true

    },// s3 link

    style: {

        type: String

    },

    availableSizes: {
        type: [String],
        enum: ["S", "XS", "M", "X", "L", "XXL", "XL"]

    },

    installments: {

        type: Number,
        default: 0,
        required: true

    },

    deletedAt: {

        type: Date,
        default: null

    },

    isDeleted: {
        
        type: Boolean,
        default: false

    }
}, {timestamp: true})

module.exports = mongoose.model("product", productSchema);