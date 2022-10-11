const express = require("express")
const mongoose = require("mongoose")
const route = require('../src/routes/route');
const multer = require('multer')
const app =express();

app.use(express.json());
app.use(multer().any())


let url = "mongodb+srv://saurav438c:Bharat123@cluster0.ueecgjt.mongodb.net/project5"
let port = process.env.PORT || 3000;

mongoose.connect(url, {useNewUrlParser: true})
.then(()=> console.log("MongoDB is connected...."))
.catch(err => console.log(err));

app.use("/", route);

app.listen(port, ()=>{
    console.log("Express app is running on port" +port);
})
