const productModel = require('../model/productModel')
const validate = require('../validator/validator.js')
const aws = require('../validator/aws')

const createProduct = async (req, res) => {
try {

    let requestBody = JSON.parse(JSON.stringify(req.body))

    if (!validate.isValidRequestBody(requestBody)) {

        return res.status(400).send({ status: false, message: `invalid request params` })
    }

    let files = req.files
    if (files && files.length > 0) {

        if (!validate.isValidImage(files[0])) {
            return res.status(400).send({ status: false, message: `invalid image type` })

        }

    } else {
        return res.status(400).send({ status: false, message: "No file to write" });
    }

    let {
        title,
        description,
        price,
        currencyId,
        currencyFormat,
        isFreeShipping,
        style,
        availableSizes,
        installments,

    } = requestBody

    if (!validate.isValid(title)) {
        return res.status(400) .send({ status: false, message: `title is required` })
             
    }

    let dupliTitle = await productModel.findOne({ title: title }) //, isDeleted:False

    if (dupliTitle) {
         return res.status(400).send({ status: false, message: "product with this title already exists" })
    }

    if (!validate.isValid(description)) {
        return res.status(400).send({ status: false, message: `invalid Discription` })
            
    }

    if (!validate.isValid(price)) {
        return res.status(400).send({status:false , message: "Pleae provide price field" })

    }

    if (!validate.isValidNumber(parseInt(price))) {
        return res.status(400).send({ status: false, message: `price attribute should be Number/ decimal Number Only` })

    }

    if(requestBody.hasOwnProperty('currencyId')) {

        if (!validate.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: `please Provide Currency Id Field` })
    
        }

        if (currencyId !=   'INR' ) {
            return res.status(400).send({ status: false, message: `${currencyId} is Not A Valid Currency Id` })
   
       }
    }
    
    if(requestBody.hasOwnProperty('currencyFormat')) {

        if (!validate.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: `please Provide CurrencyFormat Field` })

        }

        if (currencyFormat != '₹' ) {
            return res.status(400).send({ status: false, message: `${currencyFormat} Is Not A Valid Curency Format` })

        }

    }

    if (requestBody.hasOwnProperty('isFreeShipping')) {

        if (!validate.isValidBoolean((isFreeShipping))) {
             return res .status(400).send({ status: false, message: `is Free Shipping Should Be a Boolean value` })
        }

    }

    if (!validate.isValid(availableSizes)) {
        return res.status(400).send({ status: false, message: "Please provide AvailableSizes field" })

    }

    const availableSizesArr = JSON.parse(availableSizes)
    

    if(!validate.isValidSize(availableSizesArr)){

        return res.status(400).send({ status: false, message: `please Provide Available Size from ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
         
    }

    if (installments) {

        if (!validate.isValidNumber(parseInt(installments))) {
            return res.status(400).send({ status: false, message: `Invalid installments. should be Number only` })
        }

    }

    if (style) {

        if (!validate.isValid(style)) {
            return res.status(400).send({ status: false, message: "Please input style" })
        }

    }

    let uploadedFileURL = await aws.uploadFile(files[0])
        /// if(!uploadedFileURL){return res.status(400)}


    let finalData = {

        title: title,
        description: description,
        price,
        currencyId: currencyId,
        currencyFormat : currencyFormat ? currencyFormat : "₹" ,
        isFreeShipping: isFreeShipping ? isFreeShipping : true ,
        productImage: uploadedFileURL,
        style,
        availableSizes: validate.isValidSize(availableSizesArr),
        installments
    }

    const newProduct = await productModel.create(finalData)
    return res.status(201).send({ status: true, message: 'Success', data: newProduct })

} catch (err) {
    console.log(err)
    res.status(500).send({ status: false, message: err.message })
}
}
const getProduct = async (req, res) => {

    let {

        size,
        name,
        priceGreaterThan,
        priceLessThan,
        priceSort

    } = req.query

    let filters = { 
        isDeleted: false,
        deletedAt: null 
    }

    if ('size' in req.query) {

        let validSizes = validate.isValidSize(JSON.parse(size))

        if (!validSizes) {
            return res.status(400).send({ status: false, message: `please Provide Available Size from ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }
        filters['size'] = { $in: validSizes }
    }

    if ('name' in req.query) {

        if (!validate.isValid(name)) {
            return res.status(400).send({ status: false, message: `invalid Input - Name` })
        }
        filters['title'] = { $regex: name ,$options: "i" }

    }

    if ('priceGreaterThan' in req.query && 'priceLessThan' in req.query) {

        if (!validate.isValidNumber(parseInt(priceGreaterThan))) {
            return res.status(400).send({ status: false, message: `invalid price - Enterd` })
        }

        if (!validate.isValidNumber(parseInt(priceLessThan))) {
            return res.status(400).send({ status: false, message: `invalid price - Enterd` })
        }

        filters['price'] = { $gt: priceGreaterThan, $lt: priceLessThan }
        

    } else if ('priceGreaterThan' in req.query) {

        if (!validate.isValidNumber(parseInt(priceGreaterThan))) {
            return res.status(400).send({ status: false, message: `invalid price - Enterd` })
        }

        filters['price'] = { $gt: priceGreaterThan }


    } else if ('priceLessThan' in req.query) {

        if (!validate.isValidNumber(parseInt(priceLessThan))) {
            return res.status(400).send({ status: false, message: `invalid price - Enterd` })
        }

        filters['price'] = { $lt: priceLessThan }


    }

    let sort = {}

    if ('priceSort' in req.query) {

        if (!['-1', '1'].includes(priceSort) || isNaN(priceSort)) {
            return res.status(400).send({ status: false, message: `Please Enter valid Sorting ie[-1, 1]` })
        }
        sort['price'] = priceSort
    }

    const dataByFilters = await productModel.find(filters).sort(sort)

    if (dataByFilters.length == 0) {
        return res.status(404).send({ status: false, message: "no products with the given queries were found" })

    }

    return res.status(200).send({ status: true, message: `Success`, data: dataByFilters })

}

//....................................................................................................................

const getProductById = async function (req, res) {
    try {
        let pid = req.params.productId
    
        if (!validate.isValidObjectId(pid)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product id" })
    
        }
    
        let product = await productModel.findById(pid)
        if (!product) {
            return res.status(404).send({ status: false, message: "No product with this id exists" })
    
        }
    
        if (product.isDeleted === true) {
            return res.status(400).send({ status: false, message: "Product is deleted" })
    
        }
    
        return res.status(200).send({ status: true, message: "Success", data: product })
    
    
    
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
    
    }



module.exports = { createProduct, getProduct, getProductById }