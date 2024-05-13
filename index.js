const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xtia1kx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    // Database and collections
    const blogsCollection = client.db('sagaScribeDB').collection('blogs');
    const wishlistCollection = client.db('sagaScribeDB').collection('wishlist');
    const commentsCollection = client.db('sagaScribeDB').collection('comments');

    // Find all blogs or find a specific category blogs
    app.get('/blogs', async (req, res) => {
      let query = {}
      if (req.query?.category) {
        query = { category: req.query.category }
      }

      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    // Find wishlist blogs by specific user
    app.get('/wishlist/:email', async(req, res) => {
      const email = req.params.email;
      const query = {wisher_email: email}
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id)};
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    app.post('/blogs', async(req, res) => {
      const data = req.body;
      const result = await blogsCollection.insertOne(data);
      res.send(result);
      // console.log(data)
    });

    app.post('/wishlist', async(req, res) => {
      const data = req.body;
      const result = await wishlistCollection.insertOne(data);
      res.send(result);
    });

    // Add comments to database
    app.post('/comments', async(req, res) => {
      const data = req.body;
      console.log(data);
      const result = await commentsCollection.insertOne(data);
      res.send(result);
    })

    app.delete('/wishlist/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: id}
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
      // console.log(req.params.id)
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


app.get('/', (req, res) => {
  res.send('Saga Scrive Server is Running');
});

app.listen(port, () => {
  console.log(`Saga Scribe listening on port ${port}`)
})