const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const jwtTokenSecret = process.env.ACCESS_TOKEN_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Middleware
const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({ message: 'Unauthorized access' });
	}
	const token = authHeader.split(' ')[1];

	jwt.verify(token, jwtTokenSecret, (err, decoded) => {
		if (err) {
			return res.status(403).send({ message: 'Unauthorized access' });
		}

		req.decoded = decoded;
		next();
	});
}


// Mongo Database
const mongoDBUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l80pesm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
	try {
		// Jwt Token
		app.post('/jwt', (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, jwtTokenSecret, { expiresIn: 60 * 60 * 24 });

			res.send({ token });
		});

		// MongoDB
		const servicesCollection = client.db('geniusCar').collection('services');
		const ordersCollection = client.db('geniusCar').collection('orders');

		// Services
		app.get('/services', async (req, res) => {
			const { search, price: priceOrder } = req.query;

			const priceQueryLGte = { price: { $gte: 50, $lte: 200 } } // Less/Getter then or equal
			const priceQueryEq = { price: { $eq: 150 } } // Equal
			const priceQueryNq = { price: { $ne: 150 } } // Not equal

			const searchQuery = search ? { $text: { $search: search } } : {};

			const query = { ...searchQuery };
			const cursor = servicesCollection.find(query).sort({ price: 'htl' === priceOrder ? -1 : 1 });
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
		app.get('/orders', verifyJWT, async (req, res) => {
			const decoded = req.decoded;
			if (decoded.email !== req.query?.email) {
				return res.status(403).send({ message: 'Unauthorized access' });
			}

			let query = {};
			if (req.query?.email) {
				query = { customerEmail: req.query?.email }
			}

			const cursor = ordersCollection.find(query);
			const orders = await cursor.toArray();

			res.send(orders);
		})

		app.post('/orders', verifyJWT, async (req, res) => {
			const order = req.body;
			const result = await ordersCollection.insertOne(order);

			res.send(result);
		});

		app.patch('/orders/:id', verifyJWT, async (req, res) => {
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

		app.delete('/orders/:id', verifyJWT, async (req, res) => {
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