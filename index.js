const express = require('express');
const path = require('path');
// const bodyParser = require('body-parser'); // Needed for real login data handling

const app = express();
const PORT = 3000;

// In a real application, replace this with a secure database connection and JWTs/sessions.
const ADMIN_USERNAME = 'admin'; 
const ADMIN_PASSWORD = 'password';

// Middleware
// app.use(bodyParser.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (like index.html)

// --- API Routes ---

// 1. Root Route: Serves the Admin Panel HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Mock Login API
app.post('/api/login', (req, res) => {
    // In a real application: 
    // const { username, password } = req.body;
    // For this mock, we'll assume the front-end handles the validation first.
    
    // Simulating database check (THIS IS NOT SECURE FOR PRODUCTION!)
    // If you uncomment the front-end JS to use this endpoint, you'd need the real body-parser and request handling.
    
    /*
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Successful login
        res.json({ success: true, token: 'fake-jwt-token' });
    } else {
        // Failed login
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    */
   
   // For the provided front-end, we'll just send a success message.
   res.json({ success: true, message: 'Login simulation successful.' });
});

// 3. Example Dashboard Data API (Authenticated route)
app.get('/api/dashboard', (req, res) => {
    // In a real app, this would check the user's token/session first
    const dashboardData = {
        newBookings: 25,
        completedPujas: 450,
        newPandits: 8,
        totalRevenue: '₹ 5,20,000',
        recentBookings: [
            { id: 'B-1004', puja: 'Satyanarayan Katha', name: 'Aman Agarwal', status: 'Approved' },
            // ... more data from database
        ]
    };
    res.json(dashboardData);
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:5500/admin.html#`);
    console.log('Open https://s895d3qg-5500.inc1.devtunnels.ms/index.html# npm installin your browser to view the Admin Panel.');
});