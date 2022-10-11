const express = require('express')
const router = express.Router()
const userController = require('../controller/usercontroller')






router.post('/register', userController.register)

module.exports = router
