const productModel = require('../model/productModel')
const validate = require('../validator/validator.js')
const aws = require('../validator/aws')
const moment = require('moment')


//=========================================Create Product Api================================================

const createProduct = async (req, res) => {
try {

    let requestBody = req.body
    let files = req.files

    if(Object.keys(requestBody).length == 0 && !files) return res.status(400).send({status: false, message: "invalid request body !"})


    if (!validate.isValidRequestBody(requestBody)) {

        return res.status(400).send({ status: false, message: `invalid request params` })
    }

    if (files && files.length > 0) {

        if (!validate.isValidImage(files[0])) {
            return res.status(400).send({ status: false, message: `invalid image type` })

        }

    } else {
        return res.status(400).send({ status: false, message: "No file to write" });
    }

    let {title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments} = requestBody

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

    if (!validate.isValidNumber(price)) {
        return res.status(400).send({ status: false, message: `price attribute should be Number/ decimal Number Only` })

    }

    if(requestBody['currencyId']) {

        if (!validate.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: `please Provide Currency Id Field` })
    
        }

        if (currencyId != 'INR' ) {
            return res.status(400).send({ status: false, message: `${currencyId} is Not A Valid Currency Id` })
   
       }
    }
    
    if(requestBody['currencyFormat']) {

        if (!validate.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: `please Provide CurrencyFormat Field` })

        }

        if (currencyFormat != '₹' ) {
            return res.status(400).send({ status: false, message: `${currencyFormat} Is Not A Valid Curency Format` })

        }

    }

    if (requestBody['isFreeShipping']) {

        if (!validate.isValidBoolean(isFreeShipping)) {
             return res .status(400).send({ status: false, message: `is Free Shipping Should Be a Boolean value` })
        }

    }

    let arr
    if(availableSizes) {
        arr = availableSizes.split(",")
        
        if(!validate.isValidSizes(arr)){
            return res.status(400).send({ status: false, message: `please Provide Available Size from ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        } 
    }



    if (installments) {

        if (!validate.isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please input installment" })
        }

        if (!validate.isValidNumber(parseInt(installments))) {
            return res.status(400).send({ status: false, message: `Invalid installments. should be greter than 0 and Number only` })
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
        isFreeShipping: isFreeShipping ? isFreeShipping : false ,
        productImage: uploadedFileURL,
        style,
        availableSizes: validate.isValidSizes(arr),
        installments: installments ? installments : 0
    }

    const newProduct = await productModel.create(finalData)
    return res.status(201).send({ status: true, message: 'Success', data: newProduct })

} catch (err) {
    res.status(500).send({ status: false, message: err.message })
}
}

//=========================================Get Product Api==============================================

const getProduct = async (req, res) => {
try{

    let {size, name, priceGreaterThan, priceLessThan, priceSort} = req.query

    let filters = { isDeleted: false, deletedAt: null }

    if ('size' in req.query) {
        let arr = size.split(",")
    
        if (!validate.isValidSizes(arr)) {
            return res.status(400).send({ status: false, message: `please Provide Available Size from ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }

        let validSizes = validate.isValidSizes(arr)
        filters['availableSizes'] = { $in: validSizes }
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

}catch (error) {
    res.status(500).send({ status: false, message: error.message })
}
}


//=====================================Get Product By Id Api==================================================


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
        return res.status(500).send({ status: false, message: err.message })
    }
    
}


//========================================Update Product Api================================================


const updateProduct = async function (req, res) {
    let pId = req.params.productId;
    let body = req.body

    if(!validate.isValidObjectId(pId)) return res.status(400).send({ status: false, message: "Enter valid ProductId"})
    if(!validate.isValidRequestBody(body)) return res.status(400).send({ status: false, message: "Enter attributes which want to update"})

    const {title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = body
    const obj = {}

    if(title) {
        if(!validate.isValid(title)) 
        return res.status(400).send({ status: false, message: "Title is required"})

        let existTitle = await productModel.findOne({title})
        if(existTitle) return res.status(400).send({ status: false, message: "Title is already in use"})
        obj['title'] = title;
    }

    if(description) {
        if(!validate.isValid(description)) 
        return res.status(400).send({ status: false, message: "Description is required"})

        obj['description'] = description
    }

    if(price) {

        if (!validate.isValid(price)) {
            return res.status(400).send({status:false , message: "Pleae provide price field" })
        }
    
        if (!validate.isValidNumber(price)) {
            return res.status(400).send({ status: false, message: `price attribute should be Number/ decimal Number Only` }) 
        }

        obj['price'] = price
    }

    if(currencyId) {
        if (currencyId != 'INR' ) {
            return res.status(400).send({ status: false, message: `${currencyId} is Not A Valid Currency Id, The currency Id Should be INR` })
       }
       obj['currencyId'] = currencyId
    }
    
    if(currencyFormat) {

        if (currencyFormat != '₹' ) {
            return res.status(400).send({ status: false, message: `${currencyFormat} Is Not A Valid Curency Format, The Format Should be '₹'` })
        }
        obj['currencyFormat'] = currencyFormat
    }

    if(isFreeShipping) {
        if(!validate.isValidBoolean(isFreeShipping)) {
        return res.status(400).send({ status: false, message: `is Free Shipping Should Be a Boolean value` })
        }
        obj['isFreeShipping'] = isFreeShipping
    }

    let file = req.files
    if(file && file.length > 0) {
        if(!validate.isValidImage(file[0])) {
          return res.status(400).send({status: false, Message: "Invalid image type" })
        }
  
        let uploadedFileURL = await aws.uploadFile(file[0])
        if(uploadedFileURL) obj['profileImage'] = uploadedFileURL
      } 

    if (style) {

        if (!validate.isValid(style)) {
            return res.status(400).send({ status: false, message: "Please input style" })
        }
        obj['style'] = style
    }

    if(availableSizes) {

        let arr = availableSizes.split(",")
        
        if(!validate.isValidSizes(arr)){
            return res.status(400).send({ status: false, message: `please Provide Available Size from ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        } 
            
        let size1 = validate.isValidSizes(arr)
    
        let availabeSize = await productModel.findOne({_id: pId})
        let size2 = availabeSize.availableSizes
        var myFinalArray = size1.concat(size2.filter((item) => size1.indexOf(item) < 0));
        obj['availableSizes'] = myFinalArray
    }

    if (installments) {

        if (!validate.isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please input installment" })
        }

        if (!validate.isValidNumber(parseInt(installments))) {
            return res.status(400).send({ status: false, message: `Invalid installments. should be greter than 0 and Number only` })
        }
        obj['installments'] = installments
    }

    let filter = {_id: pId, isDeleted: false, deletedAt: null}

    let productUpdate = await productModel.findOneAndUpdate(filter, obj, {new: true});
    if(!productUpdate) return res.status(404).send({ status: false, message: "Product is not Found"})

    return res.status(200).send({sttus: true, Message: "Success", data: productUpdate})


}

//////////////////////// DELETE PRODUCT ///////////////////////////////////


const deleteProduct = async (req, res) => {
    const pId = req.params.productId;
    if(!validate.isValidObjectId(pId)) return res.status(400).send({ status: false, message: "Enter valid ProductId"})

    let filter = {_id: pId, isDeleted: false, deletedAt: null}

    let TIME = moment().format()


    let product = await productModel.findOneAndUpdate(filter, {$set:{isDeleted: true, deletedAt: TIME}}, {new: true})
    if(!product) return res.status(404).send({ status: false, message: "Product is not found"})

    return res.status(200).send({status: true, Message: "Success", data: product})

}


module.exports = { createProduct, getProduct, getProductById, updateProduct, deleteProduct }