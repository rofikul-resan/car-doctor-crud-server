const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();
//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.absippg.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
  console.log(token);
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect((err) => {
      if (err) {
        console.log(err);
        return;
      }
    });
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

    app.get("/booking", verifyJwt, async (req, res) => {
      const queryEmail = req.query.email;
      const decoded = req.decoded;
      console.log(decoded);
      if (decoded.email !== queryEmail) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      const query = {
        email: queryEmail,
      };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...data,
        },
      };

      const result = await orderCollection.updateOne(query, updateDoc);
      console.log(id);
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });
      res.send({ token });
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
