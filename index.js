const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// MiddleWare 
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
  }
app.use(cors(corsOptions))
app.use(express.json())


app.get("/", (req,res) =>{
    res.send("Welcome to Life Learning Server")
});




app.listen(port, ()=>{
    console.log(`Life Learning server running on: ${port}`)
})


