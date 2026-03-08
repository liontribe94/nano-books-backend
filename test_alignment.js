const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let token = '';

async function setup() {
    const email = `test.user.${Date.now()}@example.com`;
    const password = 'password123';

    try {
        // Register
        console.log(`Registering new user: ${email}`);
        await axios.post(`${BASE_URL}/users/register`, {
            email,
            password,
            name: 'Test Admin',
            companyName: 'Test Corp'
        });

        // Login
        const response = await axios.post(`${BASE_URL}/users/login`, {
            email,
            password
        });
        token = response.data.token;
        console.log('Logged in successfully');
    } catch (error) {
        console.error('Setup failed', error.response?.data || error.message);
    }
}

async function testProductCreation() {
    try {
        const response = await axios.post(`${BASE_URL}/products`, {
            name: 'Test Product ' + Date.now(),
            sku: 'SKU-' + Date.now(),
            price: 100,
            initialStock: 10,
            unit: 'item'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Product created successfully:', response.data.success);
    } catch (error) {
        console.error('Product creation failed:', error.response?.data || error.message);
    }
}

async function testExpenses() {
    try {
        // Create
        const createResponse = await axios.post(`${BASE_URL}/expenses`, {
            category: 'Office Supplies',
            amount: 50.5,
            expenseDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            description: 'Test Expense'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const expenseId = createResponse.data.data.id;
        console.log('Expense created successfully:', createResponse.data.success);

        // Get All
        const getAllResponse = await axios.get(`${BASE_URL}/expenses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched expenses count:', getAllResponse.data.data.length);

        // Update
        const updateResponse = await axios.patch(`${BASE_URL}/expenses/${expenseId}`, {
            amount: 60.0
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Expense updated successfully:', updateResponse.data.success);

        // Delete
        const deleteResponse = await axios.delete(`${BASE_URL}/expenses/${expenseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Expense deleted successfully:', deleteResponse.data.success);

    } catch (error) {
        console.error('Expense tests failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    await setup();
    if (token) {
        await testProductCreation();
        await testExpenses();
    }
}

runTests();
