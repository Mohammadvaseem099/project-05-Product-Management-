const userModel = require('../model/userModel')
const validator = require('../validator/validator')
const aws = require('../validator/aws')



const register = async (req, res) => {
  try {

   let requestBody = JSON.parse(JSON.stringify(req.body))
   //let requestBody=req.body

    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: 'invalid Input Parameters' })
    }

    let { fname, lname, email, phone, password, address } = requestBody

    address = JSON.parse(address)

    let files = req.files
    let uploadedFileURL

    if (!validator.isValid(fname)) {

      return res.status(400).send({ Status: false, Message: 'invalid First Name' })
    }

    if (!validator.isValidCharacters(fname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }


    if (!validator.isValid(lname)) {
      return res.status(400).send({ Status: false, message: 'invalid last Name' })
    }

    if (!validator.isValidCharacters(lname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }

    if (!validator.isValid(email)) {
      return res .status(400).send({ status: false, message: 'email is required' })
    }

    if (!validator.isValidEmail(email)) {
      return res.status(400) .send({ status: false, message: 'please enter a valid email' })
    }

    let isEmailExist = await userModel.findOne({ email })
    if (isEmailExist) {
      return res.status(400).send({ status: false, message: `This email ${email} is Already In Use` })
    }

    if (!validator.isValid(phone)) {
      return res.status(400).send({ Status: false, message: "Please provide phone number" })

    }

    if (!validator.isValidPhone(phone)) {
      return res.status(400).send({ status: false, message: 'Enter A valid phone Nummber' })

    }

    let isPhoneExist = await userModel.findOne({ phone })
    if (isPhoneExist) {
      return res.status(400) .send({ status: false, message: `This Phone ${phone} No. is Already In Use` })
    }

   if (!validator.isValid(password)) {
      return res.status(400).send({ status: false, message: 'password Is Required' })
    }

    password = password.trim()

    if (!validator.isvalidPass(password)) {
      return res.status(400).send({ status: false, message: `password Should Be In Beetween 8-15 ` })
    }

    let hashedPassword = await validator.hashedPassword(password)


    if (!address) {
      return res.status(400).send({ status: false, message: 'address is required' })
    }

    if (!validator.isValid(address['shipping']['street'])) {
      return res.status(400).send({ status: false, message: 'Shipping Street is required' })
    }

    if (!validator.isValid(address['shipping']['city'])) {
      return res .status(400).send({ status: false, message: 'Shipping city is required' })

    }

    if (!validator.isValid(address['shipping']['pincode'])) {
      return res.status(400).send({ status: false, message: 'Shipping Pincode is required' })
    }

    if (!validator.isValidPincode(parseInt(address['shipping']['pincode']))) {
      return res.status(400).send({ status: false, message: 'Invalid pincode' })

    }

    if (!validator.isValid(address['billing']['street'])) {
      return res.status(400).send({ status: false, message: 'Billing Street is required' })

    }

    if (!validator.isValid(address['billing']['city'])) {
      return res.status(400).send({ status: false, message: 'Billing city is required' })

    }

    if (!validator.isValid(address['billing']['pincode'])) {
      return res.status(400).send({ status: false, message: 'Billing Pincode is required' })
    }

    if (!validator.isValidPincode(parseInt(address['billing']['pincode']))) {
      return res.status(400).send({ status: false, message: 'Invalid pincode' })

    }


    if (files && files.length > 0) {

      if (!validator.isValidImage(files[0])) {
        return res.status(400).send({ status: false, message: `invalid image type` })

      }

    } else {
      return res.status(400).send({ status: false, message: "No file to write" });
    }

    uploadedFileURL = await aws.uploadFile(files[0]);

    let finalData = {
      fname:fname,
      lname,
      email,
      profileImage: uploadedFileURL,
      phone,
      password: hashedPassword,
      address
    }

    const newUser = await userModel.create(finalData)
    return res.status(201).send({ status: true, message: 'Success', Data: newUser })

  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

module.exports.register = register;


