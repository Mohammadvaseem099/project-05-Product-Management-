const userModel = require('../model/userModel')
const cartModel = require('../model/cartModel')
const productModel = require('../model/productModel')
const validate = require('../validator/validator')
const orderModel = require('../model/orderModel')

const createOrder = async (req, res) => {
    try{
       
        let userId = req.params.userId.trim()
        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is Not A Valid User Id` })
        }
        
        const isUserExist = await userModel.findById(userId)
        if (!isUserExist) {
            return res.status(404).send({ status: false, message: `user Not Found Please Check User Id` })
        }
        //Authorization
        if (isUserExist._id != req.token1.id) {
            return res.status(403).send({ status: false, message: `Unauthorized Request !` })
        }
        
        if (!validate.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: `Invalid Input Parameters` })
        }
        
        let { cartId, cancellable } = req.body
        
        if (!validate.isValid(cartId)) {
            return res.status(400).send({ status: false, message: `cartId Should Be present in request body` })
        }

        if (!validate.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: `${cartId} is not a valid cart id` })
        }
        
        let isCartIdExists = await cartModel.findById(cartId)
        if(!isCartIdExists) return res.status(404).send({ status: false, message: `cart Not Found Please Check cart Id` })

        if(!isCartIdExists.items.length > 0) {
            return res.status(400).send({ status: false, message: `Cart is empty` })
        }

        if(cancellable) {
            if(!validate.isValidBoolean(cancellable)) {
                return res.status(400).send({ status: false, message: `${cancellable} is not a valid value` })
            }
        }

        if(userId != isCartIdExists.userId) {
            return res.status(400).send({ status: false, message: `The cart is not belongs to this User` }) 
        }

        let itemList = isCartIdExists.items
        let quantity = itemList.map( (ele) => ele = ele.quantity )
        let totalItem = quantity.reduce((a, b) => a + b)

        const obj = {}

        obj['userId'] = isCartIdExists.userId
        obj['items'] = isCartIdExists.items
        obj['totalPrice'] = isCartIdExists.totalPrice
        obj['totalItems'] = isCartIdExists.totalItems
        obj['totalQuantity'] = totalItem
        obj['cancellable'] = cancellable ? cancellable: true


        await cartModel.findOneAndUpdate({ userId: userId },
            { $set: { items: [], totalItems: 0, totalPrice: 0 } })
          
        
        const newOrder = await orderModel.create(obj)
        return res.status(201).send({ status: true, message: `Success`, data: newOrder })

    } 
    catch (err) {
    return res.status(500).send({status: true, message: err.message})

    }

}


//======================================Update Order Api=====================================================

const updateOrder = async (req, res) => {

    try {
    let userId = req.params.userId.trim()
    if (!validate.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: `${userId} is Not A Valid User Id` })
    }
    
    const isUserExist = await userModel.findById(userId)
    
    if (!isUserExist) {
        return res.status(404).send({ status: false, message: `userNot Found Please Check User Id` })
        }
        //Authorization
    if (isUserExist._id != req.token1.id) {
        return res.status(403).send({ status: false, message: `Unauthorized Request !` })
    }

    if (!validate.isValidRequestBody(req.body)) {
         return res.status(400).send({ status: false, message: `Invalid Input Parameters` })
    }

    let { orderId, status } = req.body
    
    if (!req.body.hasOwnProperty('orderId')) {
        return res.status(400).send({ status: false, message: `Order Id Should Be Present In RequestBody` })
    }

    if (!validate.isValid(orderId)) {
        return res.status(400).send({ status: false, message: "Order id should be a valid string" })
    }
    
    orderId = orderId.trim()
    
    if (!validate.isValidObjectId(orderId)) {
        return res.status(400).send({ status: false, message: `${orderId} is Not A Valid Object Id` })
    }

    const isValidOrder = await orderModel.findById(orderId)
    
    if (!isValidOrder) {
    return res.status(404).send({ status: false, message: `No Order Found By This ${orderId} id` })
    }

    if (isValidOrder.userId != userId) {
        return res.status(403).send({ status: false, message: `order ${orderId} Does Not Belongs To ${userId} user` })
    }

    if (!req.body.hasOwnProperty('status')) {
        return res.status(400).send({ status: false, message: `Status Should Be Present In Request Body` })
    }

    if (!validate.isValid(status)) {
        return res.status(400).send({ status: false, message: `Status should be a valid string` })

    }
    status = status.trim()

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).send({ status: false, message: `Status Should Be from [pending, completed, cancelled]` })
    }

    if (isValidOrder.cancellable == false && status == 'cancelled') {
        return res.status(400).send({ status: false, message: `Order Cannot Be Cancelled, this order is Not Canceelable  ` })
    }

    if(isValidOrder.status == "pending" && status == 'pending') {
        return res.status(400).send({ status: false, message: `Order already in pending state, Please provide cancelled or completed` })
    }

    if(isValidOrder.status == "completed" && status != 'completed') {
        return res.status(400).send({ status: false, message: `Once, Order completed cannot be cancelled or pending ` })
    }


    const updatedOrder = await orderModel.findByIdAndUpdate({ _id: orderId },
        { $set: { status: status } },
        { new: true })

        return res.status(200).send({ status: false, message: 'Success', data: updatedOrder })
} catch (err) {
    return res.status(500).send({ status: false, message: err.message })
}

}

module.exports = {updateOrder, createOrder}
