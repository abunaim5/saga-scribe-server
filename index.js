const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://saga-scribe.web.app',
    'https://saga-scribe.firebaseapp.com'
  ],
  credentials: true,
}));



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xtia1kx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const PUBLIC_KEY=process.env.ATLAS_PUBLIC_KEY
const PRIVATE_KEY=process.env.ATLAS_PRIVATE_KEY
const GROUP_ID=process.env.ATLAS_PROJECT_ID
const CLUSTER_NAME=process.env.Cluster0
const ATLAS_SEARCH_INDEX_API_URL=`https://cloud.mongodb.com/api/atlas/v1.0/groups/${GROUP_ID}/clusters/${CLUSTER_NAME}/fts/indexes?pretty=true`
const  DIGEST_AUTH=`${PUBLIC_KEY}:${PRIVATE_KEY}`
const CONTENT_HEADER="Content-Type: application/json"


async function upsertSearchIndex() {
  await request(ATLAS_SEARCH_INDEX_API_URL, {
      data:{
        "collectionName" : "blogs",
        "database" : "sagaScribeDB",
        "indexID" : "60bfd25f59fc81594354eed3",
        "mappings" : {
          "dynamic" : true
        },
        dataType: 'json',
        contentType: CONTENT_HEADER,
        method: 'POST',
        digestAuth: DIGEST_AUTH,
        "name" : "default",
        "status" : "IN_PROGRESS"
      }
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Database and collections
    const blogsCollection = client.db('sagaScribeDB').collection('blogs');
    const wishlistCollection = client.db('sagaScribeDB').collection('wishlist');
    const commentsCollection = client.db('sagaScribeDB').collection('comments');
    // blogsCollection.createIndex({ title: 'text' })

    // Find all blogs or find a specific category blogs
    app.get('/blogs', async (req, res) => {
      let query = {}
      if (req.query?.category) {
        query = { category: req.query.category }
      }
      if (req.query?.title) {
        const text = req.query?.title
        query = { $text: { $search: text } }
      }
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/recentblogs', async (req, res) => {
      const result = await blogsCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get('/featured', async (req, res) => {
      let query = {}
      const sort = {long_description: -1}
      const result = await blogsCollection.find(query).sort(sort).limit(10).toArray()
      res.send(result);
    });

    // Find wishlist blogs by specific user
    app.get('/wishlist/:email', async (req, res) => {
      const email = req.params.email;
      const query = { wisher_email: email }
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    })

    // Find comments by specific blog id
    app.get('/comments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { blog_id: id }
      const result = await commentsCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    app.post('/blogs', async (req, res) => {
      const data = req.body;
      const result = await blogsCollection.insertOne(data);
      res.send(result);
      // console.log(data)
    });

    app.post('/wishlist', async (req, res) => {
      const data = req.body;
      const result = await wishlistCollection.insertOne(data);
      res.send(result);
    });

    // Add comments to database
    app.post('/comments', async (req, res) => {
      const data = req.body;
      const result = await commentsCollection.insertOne(data);
      res.send(result);
    });

    app.put('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updatedData
        }
      }
      const result = await blogsCollection.updateOne(filter, updateDoc, options)
      res.send(result);
    })

    app.delete('/wishlist/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
      // console.log(req.params.id)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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