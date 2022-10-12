const express = require('express')
const router = express.Router()
const userController = require('../controller/usercontroller')
const auth = require('../middleware/auth')
const productController = require('../controller/productController')





router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/user/:userId/profile',auth.authenticate, userController.getUser)
router.put('/user/:userId/profile',auth.authenticate, auth.authorization, userController.updateUser)

router.post("/products", productController.createProduct)

module.exports = router
