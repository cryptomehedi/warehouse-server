const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 4000
require('dotenv').config();


// mid ware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkpap.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try {
        await client.connect()
        const productCollection = client.db('warehouse').collection('product')

        app.get('/stock', async (req, res) =>{
            const query = {}
            const cursor = productCollection.find(query)
            const service = await cursor.toArray()
            res.send(service)
        })



    }
    finally{

    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Server running Successfully')
})

app.listen(port)