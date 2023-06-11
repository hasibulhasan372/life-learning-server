const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_KEY)
const port = process.env.PORT || 5000;

// MiddleWare 
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


app.get("/", (req, res) => {
    res.send("Welcome to Life Learning Server")
});

const verifyJWT = (req, res, next) =>{
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: "unauthorize access"})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (error, decoded) =>{
        if(error){
            return res.status(401).send({error: true, message: "unauthorize access"})
        }
        req.decoded = decoded;
        next()
    })
};


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ml6ryd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db("lifeLearningDB").collection("users");
        const courseCollection = client.db("lifeLearningDB").collection("courses");
        const selectedCourseCollection = client.db("lifeLearningDB").collection("selectedCourses");

        // JWT 
        app.post("/jwt", (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN,{ expiresIn: '1h' })
            res.send({token})
        })

        // Verify Admin 
        const verifyAdmin = async (req, res, next) =>{
            const email = req.decoded.email;
            const query = {email: email} 
            const user = await userCollection.findOne(query)
            if(user?.role !== "admin"){
                return res.status(403).send({error: true, message: "forbidden access"})
            };
            next();
        }
        // Verify Admin 
        const verifyInstructor = async (req, res, next) =>{
            const email = req.decoded.email;
            const query = {email: email} 
            const user = await userCollection.findOne(query)
            if(user?.role !== "instructor"){
                return res.status(403).send({error: true, message: "forbidden access"})
            };
            next();
        }

        // User API 

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        });

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateUser = {
                $set:{
                    role:"admin"
                }
             };
             const result = await userCollection.updateOne(query, updateUser)
             res.send(result)
        });
        // Is Admin Route 
        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateUser = {
                $set:{
                    role:"admin"
                }
             };
             const result = await userCollection.updateOne(query, updateUser)
             res.send(result)
        });
        //  Is Instructor Route 
        app.get("/users/instructor/:email", async (req, res) =>{
            const email = req.params.email;
            if(email === req.decoded.email){
                return res.send({admin: false})
            }
            const query = {email: email}
            const user = await userCollection.findOne(query)
            const result = {admin : user?.role === "instructor"}
            res.send(result)
        });



        app.patch("/users/instructor/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateUser = {
                $set:{
                    role:"instructor"
                }
             };
             const result = await userCollection.updateOne(query, updateUser)
             res.send(result)
        });

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = {email : user.email}
            const existingUser = await userCollection.findOne(query)
            if(existingUser){
                return res.send({message: "Existing User"})
            }
            const result = await userCollection.insertOne(user);
            console.log(result)
            res.send(result)
        });
        app.delete("/users/:id", async(req,res) =>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await userCollection.deleteOne(query);
            res.send(result)
        })

        //  Classes API  
        // Only for Admin and Instructor   
        app.get("/courses", async(req, res) =>{
            let query = {};
            if (req.query?.instructorEmail) {
                query = { instructorEmail: req.query.instructorEmail }
            }
            const result = await courseCollection.find(query).toArray();
            res.send(result)
        });

        // For All 
        app.get("/coursesForAll", async(req, res) =>{
            const result = await courseCollection.find({ status: "approved"}).toArray();
            res.send(result)

        })
        // One Instructor courses  
        app.get("/coursesInstructorApproved", async(req, res) =>{
            let query = {};
            if (req.query?.instructorEmail) {
                query = { instructorEmail: req.query.instructorEmail }
            }
            const result = await courseCollection.find(query&&{ status: "approved"}).toArray();
            res.send(result)

        })

        app.patch("/courses/approved/:id", async(req, res) =>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const updateCourse = {
                $set:{
                    status: "approved"
                }
            }
            const result = await courseCollection.updateOne(query, updateCourse)
            res.send(result)
        })
        app.patch("/courses/deny/:id", async(req, res) =>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const updateCourse = {
                $set:{
                    status: "denied"
                }
            }
            const result = await courseCollection.updateOne(query, updateCourse)
            res.send(result)
        })

        
        app.post("/courses",  async(req, res) =>{
            const course = req.body;
            const result  = await courseCollection.insertOne(course)
            res.send(result)
        });

        // Courses Selected by Student 
        app.get("/selectedCourses", async(req, res) =>{
            const email = req.query.email;
            if(!email){
                res.send([])
            }
            const query = {email: email};
            const result = await selectedCourseCollection.find(query).toArray();
            res.send(result)

        })

        app.post("/selectedCourses", async(req,res) =>{
            const course = req.body;
            const result = await selectedCourseCollection.insertOne( course)
            res.send(result)
        })


        // Payment API 

        app.post("/create-payment-intent", async (req, res) =>{
            const {price} = req.body;
            const amount  = price * 100;
            const paymentIntent = await stripe.paymentIntentS.create({
                amount: amount,
                currency: "usd",
                payment_method_types:["card"]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });















        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Life Learning server running on: ${port}`)
})


