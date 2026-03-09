const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://nano-books-frontend.vercel.app',
        'https://nano-books-backend.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Nano Books API' });
});

// Use routes here later...

// Error Handling
app.use(errorHandler);

module.exports = app;
