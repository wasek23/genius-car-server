const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongo Database
const mongoDBUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l80pesm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
	try {
		const servicesCollection = client.db('geniusCar').collection('services');
		const ordersCollection = client.db('geniusCar').collection('orders');

		// Services
		app.get('/services', async (req, res) => {
			const query = {};
			const cursor = servicesCollection.find(query);
			const services = await cursor.toArray();

			res.send(services);
		});

		app.get('/services/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) }
			const service = await servicesCollection.findOne(query);

			res.send(service);
		});

		// Orders
		app.get('/orders', async (req, res) => {
			let query = {};
			if (req.query?.email) {
				query = { customerEmail: req.query?.email }
			}

			const cursor = ordersCollection.find(query);
			const orders = await cursor.toArray();

			res.send(orders);
		})

		app.post('/orders', async (req, res) => {
			const order = req.body;
			const result = await ordersCollection.insertOne(order);

			res.send(result);
		});

		app.patch('/orders/:id', async (req, res) => {
			const id = req.params.id;
			const status = req.body.status;

			const query = { _id: ObjectId(id) };
			const updatedDoc = {
				$set: {
					status
				}
			}
			const result = await ordersCollection.updateOne(query, updatedDoc);

			res.send(result);
		});

		app.delete('/orders/:id', async (req, res) => {
			const id = req.params.id;

			const query = { _id: ObjectId(id) };
			const result = await ordersCollection.deleteOne(query)

			res.send(result);
		});
	}
	finally {

	}
}
run().catch(err => console.error(err));

// Get /
app.get('/', (req, res) => {
	res.send('Genius car server is running!');
});

app.listen(port, () => {
	console.log(`Genius Car server listening on port ${port}`);
})