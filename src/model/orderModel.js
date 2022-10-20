const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        refs: "User",
    },

    items: [{
        productId: {
            type: mongoose.Types.ObjectId,
            required: true,
            refs: "Product"
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        Comment: 'Holds total price of all the items in the cart'
    },
    totalItems: {
        type: Number,
        required: true, 
        Comment: 'Holds total number of items in the cart'
    },
    totalQuantity: {
        type: Number,
        required: true, 
        Comment: 'Holds total number of items in the cart'
    },
    cancellable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'completed', 'cancelled']
    }

}, { timestamps: true })


module.exports = mongoose.model('Order', orderSchema)