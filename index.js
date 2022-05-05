const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 4000
require('dotenv').config();


// mid ware
app.use(cors());
app.use(express.json());

// jwt token
function JWTAccess(req, res, next) {
    const headerAuth = req.headers.authorization
    console.log(headerAuth);
    if(!headerAuth){
        return res.status(401).send({message: 'Invalid authorization'})
    }
    const token = headerAuth.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN_JWT, (err,decoded) => {
        if(err) return res.status(403).send({message: 'forbidden access'})
        
        req.decoded = decoded
        // console.log(decoded)
        next()
    })
    
}

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkpap.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try {
        await client.connect()
        const productCollection = client.db('warehouse').collection('product')

        app.get('/stockAllPd', async (req, res) =>{
            const query = {}
            const cursor = productCollection.find(query)
            const service = await cursor.toArray()
            res.send(service)
        })

        app.get('/pagesPd',async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if(page || size){

                products = await cursor.skip(page*size).limit(size).toArray()
            }else{
                products = await cursor.toArray()
            }
            
            res.send(products)
        })
        // Auth api token 
        app.post('/user', async (req, res)=>{
            const user = req.body
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_JWT, {
                expiresIn: '1d'
            })
            res.send({accessToken})
        })

        app.get('/allPdCount', async (req, res) => {
            const count = await productCollection.estimatedDocumentCount()
            res.send({count})
        })

        app.get('/stock/:id', JWTAccess, async (req, res) =>{
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const service = await productCollection.findOne(query)
            res.send(service)
        })

        // update product
        app.put('/stock/:id', async (req, res) => {
            const id = req.params.id
            const filter = {_id : ObjectId(id)}
            const updatedPD = req.body
            const options = { upsert: true };
            const updateDoc = {
                $set: updatedPD
            }
            const result = await productCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        // add product 
        app.post('/stock', async (req, res) => {
            const newProduct = req.body
            console.log('adding new product', newProduct )
            const result = await productCollection.insertOne(newProduct)
            res.send(result)
        })
        app.delete('/stock/:id', async (req, res)=>{
            const id = req.params.id
            const query = {_id : ObjectId(id)}
            const result = await productCollection.deleteOne(query)
            res.send(result)
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