const mongoose = require('mongoose')
const productModel = require('../model/productModel')
const validator = require('../validator/validator')

const createProduct = async (req, res) => {
    try {
        let productDetails = req.body
        let files = req.files
    
        if (validator.isValidBody(productDetails)) {
            return res.status(400).send({ status: false, message: "Enter details to create Product" });
        }
        if (!validator.isValidFiles(files)) {
            return res.status(400).send({ status: false, message: "productImage is required" })
        }
    
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes,installments } = productDetails
    
        //    title validation
    
        if (!validator.isValid1(title)) {
            return res.status(400).send({ status: false, message: "title is required" })
        }
        const titlePresent = await productModel.findOne({ title: title })
        if (titlePresent) {
            return res.status(400).send({ status: false, message: "title already Present" })
        }
        // description validation
    
        if (!validator.isValid1(description)) {
            return res.status(400).send({ status: false, message: "description is required" })
        }
    
    
        if (!validator.isValid1(price)) {
            return res.status(400).send({ status: false, message: "price is required" })
        }
        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: "Enter a Valid Price" })
        }
    
        if (!validator.isValid1(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }
    
        if (!currencyId.match(/^(INR)$/)) {
            return res.status(400).send({ status: false, message: "currencyId must be INR" })
        }
        if (!validator.isValid1(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "currency format should be ₹ " })
        }
        if (!validator.isValid1(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please Provide at least one size" })
        }
        if (availableSizes) {
            let availableSize = availableSizes.toUpperCase().split(",") // Creating an array
            productDetails.availableSizes = availableSize;      //set Attribute
            let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < availableSize.length; i++) {
                if (!enumArr.includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${enumArr} value with multiple value please give saperated by comma`, })
                }
            }
        }
    
        if (isFreeShipping == "") {
            return res.status(400).send({ status: false, message: "Freeshipping can't be empty" })
        }
    
        if (isFreeShipping) {
            if (!(/^(true|false)$/).test(isFreeShipping))
                return res.status(400).send({ status: false, message: "Freeshipping must be in Boolean (true or false)" })
        }
    
        if (style == "") {
            return res.status(400).send({ status: false, message: "Put Some value in Style" })
        }
         if(installments == ''){
            return res.status(400).send({ status: false, message: "Put Some value in installments" })
         }
        if (installments) {
            if (!installments.match(/^\d*\.?\d*$/))
                return res.status(400).send({ status: false, message: "Installment must be an integer" })
        }
    
        let productImgUrl = await aws.uploadFile(files[0])
        productDetails.productImage = productImgUrl
    
        let productCreated = await productModel.create(productDetails);
        return res.status(201).send({ status: true, message: "Product created successfully", data: productCreated })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
    
    
}

module.exports = { createProduct }