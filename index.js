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


app.get("/", (req, res) => {
    res.send("Welcome to Life Learning Server")
});


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


