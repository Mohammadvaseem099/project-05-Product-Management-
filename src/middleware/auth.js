const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const ObjectId = require('mongoose').Types.ObjectId



const authenticate = async function (req, res, next) {
    try{
        let token = req.headers['authorization'].split(" ")
        let token1 = token[1];
        if(!token1) {
            return res.status(404).send({status: false, message: "Token must be present"})
        }
        jwt.verify (token1, "project05-group40", ( error, decodeToken ) => {
            if(error) {
                return res.status(401).send({status: false, message: "Token is invalid"})
            } else {
                req.token1 = decodeToken
                next()
            }
        })
    } catch (error) {
        return res.status(500).send({status: false, message: error.message})
    }

}



const authorization = async function (req, res, next) {
    try {
        let userId = req.params.userId
        // if(!userId) return res.status(400).send({status: false, message: "Please, enter correct userId"})
        

        if(!ObjectId.isValid(userId)) return res.status(400).send({status: false, message: "Please, enter correct userId"})
    
            let user = await userModel.findById({_id: userId})
          
            if(user) {  
                if(user._id.toString() != req.token1.id) return res.status(400).send({status: false, message: "Unathorized access!"})
                next()
               
            }else {
                return res.status(404).send({status: false, message: "user not found"})
            }

    } catch(error) {
        return res.status(500).send({status: false, message: error.message})
    }     

}


module.exports = { authenticate, authorization }