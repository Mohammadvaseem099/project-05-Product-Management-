const userModel = require('../model/userModel')
const validator = require('../validator/validator')
const aws = require('../validator/aws')
const bcrypt = require('bcryptjs/dist/bcrypt')
const jwt = require('jsonwebtoken')
const ObjectId = require("mongoose").Types.ObjectId;



const register = async (req, res) => {
  try {

   let requestBody= req.body
   let files = req.files
   let uploadedFileURL

   if(Object.keys(requestBody).length == 0 && !files) return res.status(400).send({status: false, message: "invalid request body !"})


    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: 'invalid Input Parameters' })
    }

    let { fname, lname, email, phone, password, address } = requestBody


    if (!validator.isValid(fname)) {
      return res.status(400).send({ Status: false, Message: 'First Name is Mandotary' })
    }

    if (!validator.isValidCharacters(fname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }


    if (!validator.isValid(lname)) {
      return res.status(400).send({ Status: false, message: 'last Name is Mandotary' })
    }

    if (!validator.isValidCharacters(lname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }

    if (!validator.isValid(email)) {
      return res .status(400).send({ status: false, message: 'email is Mandotary' })
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

    if(typeof (address) == 'string') {
      address = JSON.parse(address)
    }

    if(!address.shipping){
      return res.status(400).send({status: false, message: "Please enter Shipping address"});
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

    if (!validator.isValidPincode(address['shipping']['pincode'])) {
      return res.status(400).send({ status: false, message: 'Invalid pincode' })

    }

    if(!address.billing){
      return res.status(400).send({status: false, message: "Please enter billing address"});
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

    if (!validator.isValidPincode(address['billing']['pincode'])) {
      return res.status(400).send({ status: false, message: 'Invalid pincode' })
    }


    if (files && files.length > 0) {

      if (!validator.isValidImage(files[0])) {
        return res.status(400).send({ status: false, message: `invalid image type` })

      }

    } else {
      return res.status(400).send({ status: false, message: "profile image is mandatory" });
    }

    uploadedFileURL = await aws.uploadFile(files[0]);

    let finalData = {
      fname,
      lname,
      email,
      profileImage: uploadedFileURL,
      phone,
      password: hashedPassword,
      address
    }

    const newUser = await userModel.create(finalData)
    return res.status(201).send({ status: true, message: 'User created Successfully', Data: newUser })

  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

//////////////////////////////////// LOGIN API ////////////////////////////////////////////////////////////////

const login = async (req, res) => {
  try{
    const {email, password}  = req.body

    if(!email) return res.status(400).send({status:false, message: "Email is required"})
    if(!password) return res.status(400).send({status:false, message: "Password is required"})
  
    const user = await userModel.findOne({email})
  
    if(user) {
  
      const checkPassword = await bcrypt.compare(password, user.password)
      if(!checkPassword) return res.status(400).send({status:false, message: "Password is Wrong"})
  
    }else {
  
      return res.status(404).send({status:false, message: "user is not exists"})
    }
  
    const token = jwt.sign({
      id: user._id.toString(),
      iat: Math.floor(new Date().getTime() / 1000)
    }, "project05-group40", {expiresIn: "23h"});
  
    let data = {
      userId: user._id,
      token: token
    }

    return res.status(200).send({status: true,message:"User login Successfully", data: data})

  }
  catch(error) {
    return res.status(500).send({status: false, message: error.message})
  }
}


///////////////////////////// GET USER API /////////////////////////////////////////////////////////////////////

const getUser = async function(req, res) {
    try{
        let userId = req.params.userId
        if(!userId) {
            return res.status(400).send({status: false, message: "provide userId is params"})
        }
        if(!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Enter valid user Id" })
        }
        if(req.token1.id != userId) {
            return res.status(403).send({ status: false, message: "UserId is not authorized to access this Data" })
        }
        
        const fetchUser = await userModel.findById({_id: userId})
        
        if(!fetchUser) {
            return res.status(404).send({ status: false, message: "user is not registerd" })
        }
        return res.status(200).send({ status: true, message: "User profile details", data: fetchUser})
    } catch (error) {
        return res.status(500).send({status: false, message: error.message})
    }
}


////////////////////////////////////// UPDATE USER /////////////////////////////////////////////////////////

const updateUser = async (req, res) => {
  
  let file = req.files
  let obj = {}

  
          
    if(file && file.length > 0) {
      if(!validator.isValidImage(file[0])) {
        return res.status(400).send({status: false, Message: "Invalid image type" })
      }

      let uploadedFileURL = await aws.uploadFile(file[0])
      if(uploadedFileURL) obj['profileImage'] = uploadedFileURL
    } 
  

  
  let data = req.body
  if(Object.keys(data).length == 0 && !file) return res.status(400).send({status: false, message: "Enter data which you want to update!"})
  

  
  if(data.fname) {

    if (!validator.isValid(data.fname)) {
      return res.status(400).send({ Status: false, Message: 'invalid First Name' })
    }
  
    if (!validator.isValidCharacters(data.fname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }
    obj['fname'] = data.fname
  }
  
  if(data.lname) {

    if(!validator.isValid(data.lname)) {
      return res.status(400).send({ Status: false, Message: 'invalid Last Name' })
    }
    
    if(!validator.isValidCharacters(data.lname)) {
      return res.status(400).send({ Status: false, msg: "This attribute can only have letters as input" })
    }
    obj['lname'] = data.lname
  }
  
  if(data.email) {
    
    if(!validator.isValid(data.email)) {
      return res.status(400).send({ Status: false, Message: 'Email is required' })
    }
    
    if(!validator.isValidEmail(data.email)) {
      return res.status(400) .send({ status: false, message: 'please enter a valid email' })
    }
    
    let isEmailExist = await userModel.findOne({email: data.email})
    if(isEmailExist) return res.status(400).send({ status: false, message: `This email ${email} is Already In Use` })
    obj['email'] = data.email
  }

  let hashedPassword
  if(data.password) {

    if(!validator.isValid(data.password)) {
      return res.status(400).send({ Status: false, Message: 'Password is required' })
    }
    
    if(!validator.isvalidPass(data.password)) {
      return res.status(400) .send({ status: false, message: 'Password should be in between 8 - 15' })
    }
    hashedPassword = await validator.hashedPassword(data.password);
    obj['password'] = hashedPassword
  }
  
  if(data.phone) {

    if(!validator.isValid(data.phone)) {
      return res.status(400).send({ Status: false, Message: 'Phone is required' })
    }
    
    if(!validator.isValidPhone(data.phone)) {
      return res.status(400).send({ Status: false, Message: 'Phone no. is invalid' })
    }
  
    let isPhoneExist = await userModel.findOne({phone: data.phone})
    if(isPhoneExist) return res.status(400).send({Status: false, Message: `The Phone ${phone} no. is already used`})
    obj['phone'] = data.phone
  }


  if(data.address) {
    if(typeof (data.address) == 'string') {
       data.address = JSON.parse(data.address)
    }
    let {shipping, billing} = data.address
 
        if(shipping) {
          if(data.address['shipping']['street']){

            if (!validator.isValid(data.address['shipping']['street'])) {
              return res.status(400).send({ status: false, message: 'Shipping Street is required' })
            }

            obj["address.shipping.street"] = data.address.shipping.street;

          }
            if (data.address['shipping']['city']) {

              if(!validator.isValid(data.address['shipping']['city'])) {
                return res .status(400).send({ status: false, message: 'Shipping city is required' })
              }

              obj["address.shipping.city"] = data.address.shipping.city;

            }
            
            if(data.address['shipping']['pincode']) {

              if (!validator.isValid(data.address['shipping']['pincode'])) {
                return res.status(400).send({ status: false, message: 'Shipping Pincode is required' })
              }
              
              if (!validator.isValidPincode((data.address['shipping']['pincode']))) {
                return res.status(400).send({ status: false, message: 'Invalid pincode' })
              }

              obj["address.shipping.pincode"] = data.address.shipping.pincode;
            }
            
          }

            if(billing) { 
              if(data.address['billing']['street']) {

                if (!validator.isValid(data.address['billing']['street'])) {
                  return res.status(400).send({ status: false, message: 'Billing Street is required' })
                }

                obj["address.billing.street"] = data.address.billing.street;

              }
              
              if(data.address['billing']['city']) {

                if (!validator.isValid(data.address['billing']['city'])) {
                  return res.status(400).send({ status: false, message: 'Billing city is required' })
                }

                obj["address.billing.city"] = data.address.billing.city;
              }
              
              if(data.address['billing']['pincode']) {

                if (!validator.isValid(data.address['billing']['pincode'])) {
                  return res.status(400).send({ status: false, message: 'Billing Pincode is required' })
                }
          
                if (!validator.isValidPincode(data.address['billing']['pincode'])) {
                  return res.status(400).send({ status: false, message: 'Invalid pincode' })
                }
              }
              
              obj["address.billing.pincode"] = data.address.billing.pincode;

            }
  
        }
  

  let user = await userModel.findOneAndUpdate  ({_id: req.params.userId}, obj, {new: true})

  if(!user) return res.status(404).send({status: false, Message: "user not found" })
  return res.status(200).send({status: true, message: "User profile updated", data: user}) 

}



module.exports  = {register, login, getUser, updateUser};


