const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();

//middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.absippg.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const carServices = client.db("carDoctor").collection("services");
    const orderCollection = client.db("carDoctor").collection("orders");
    app.get("/services", async (req, res) => {
      const option = {
        projection: { title: 1, price: 1, img: 1 },
      };
      const cursor = carServices.find({}, option);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await carServices.findOne(query);
      res.send(result);
    });

    app.get("/check-out/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const option = {
        projection: { title: 1, price: 1, img: 1 },
      };

      const result = await carServices.findOne(query, option);
      res.send(result);
    });

    app.post("/orders/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const result = await orderCollection.insertOne(data);
      res.send(result);
    });

    app.get("/booking", async (req, res) => {
      const queryEmail = req.query.email;
      const query = {
        email: queryEmail,
      };
      const result = await orderCollection.find(query).toArray();
      console.log(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("car server running");
});

app.listen(port);
