const express = require("express");
const router = express.Router();
const userController = require("../controller/usercontroller");
const auth = require("../middleware/auth");
const productController = require("../controller/productController");
const cartController = require('../controller/cartcontroller')
const orderController = require('../controller/ordercontroller')

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/user/:userId/profile", auth.authenticate, userController.getUser);
router.put("/user/:userId/profile",auth.authenticate,auth.authorization,userController.updateUser);

router.post("/products", productController.createProduct);
router.get("/products", productController.getProduct);
router.get("/products/:productId", productController.getProductById);
router.put("/products/:productId", productController.updateProduct);
router.delete("/products/:productId", productController.deleteProduct);


router.post('/users/:userId/cart', auth.authenticate, cartController.createCart)
router.put('/users/:userId/cart', auth.authenticate, cartController.updateCart)
router.get('/users/:userId/cart', auth.authenticate, cartController.getById)
router.delete('/users/:userId/cart', auth.authenticate, cartController.deleteCart)


router.post('/users/:userId/orders', auth.authenticate, orderController.createOrder)
router.put('/users/:userId/orders', auth.authenticate, orderController.updateOrder)




router.all("/*", function (req, res) {
    res.status(400).send({status: false, message: "Make Sure Your Endpoint is Correct !!!"
    })
})

module.exports = router;
