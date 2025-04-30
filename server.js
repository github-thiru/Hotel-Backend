require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware Setup
app.use(express.json()); // Correct way to parse JSON requests
app.use(cors()); // Enable CORS for frontend access



//  Prevent "Unexpected end of JSON input" error
app.use((req, res, next) => {
    if (
        (req.method === "POST" || req.method === "PUT") && 
        req.headers["content-type"] === "application/json" &&
        req.headers["content-length"] === "0"
    ) {
        return res.status(400).json({ error: "Empty JSON body is not allowed" });
    }
    next();
});


//  MySQL Connection Pool
const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "123456",
    database: "hotel"});

//  Check Database Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log(" Connected to MySQL Database!");
    connection.release();
});

// ------------------ Routes ------------------

//  1. Get all hotels   okkkkkkkkk
app.get("/hotels", (req, res) => {
    db.query("SELECT * FROM hotels", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

//  2. Get hotel by ID            okkkkk
app.get("/hotels/:id", (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: "Invalid hotel ID" });

    db.query("SELECT * FROM hotels WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: "Hotel not found" });
        res.json(result[0]);
    });
});

//  3. Create a new hotel (with validation)    okkkkk
app.post("/hotels", (req, res) => {
    const { name, location, price, rating, image_url } = req.body;
    if (!name || !location || !price || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = "INSERT INTO hotels (name, location, price, rating, image_url) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, location, price, rating, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Hotel added successfully!", hotelId: result.insertId });
    });
});

//  4. Update hotel details
app.put("/hotels/:id", (req, res) => {
    const { id } = req.params;
    const { name, location, price, rating, image_url } = req.body;
    if (!name || !location || !price || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = "UPDATE hotels SET name=?, location=?, price=?, rating=?, image_url=? WHERE id=?";
    db.query(sql, [name, location, price, rating, image_url, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Hotel updated successfully!" });
    });
});

//  5. Delete a hotel
app.delete("/hotels/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM hotels WHERE id=?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(204).send();
    });
});

//  6. Get all rooms for a specific hotel    okkkkk
app.get("/hotels/:id/rooms", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM rooms WHERE hotel_id=?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

//  7. Create a booking (with conflict check)
app.post("/bookings", (req, res) => {
    const { user_id, room_id, check_in, check_out } = req.body;

    if (!user_id || !room_id || !check_in || !check_out) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
        return res.status(400).json({ error: "Invalid date format" });
    }

    if (checkInDate >= checkOutDate) {
        return res.status(400).json({ error: "Check-in date must be before check-out date" });
    }

    const checkAvailabilityQuery = `
        SELECT * FROM bookings 
        WHERE room_id = ? 
        AND status = 'confirmed'
        AND (check_in < ? AND check_out > ?)
    `;

    db.query(checkAvailabilityQuery, [room_id, check_out, check_in], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            return res.status(400).json({ error: "Room is already booked for these dates" });
        }

        const sql = "INSERT INTO bookings (user_id, room_id, check_in, check_out, status) VALUES (?, ?, ?, ?, 'pending')";
        db.query(sql, [user_id, room_id, check_in, check_out], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Booking created successfully!", bookingId: result.insertId });
        });
    });
});


//  8. Get all bookings for a user
app.get("/users/:id/bookings", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM bookings WHERE user_id=?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

//  9. Cancel a booking
app.delete("/bookings/:id", (req, res) => {
    const { id } = req.params;
    db.query("UPDATE bookings SET status='cancelled' WHERE id=?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(204).send();
    });
});

//  Start Server
const PORT = 5004;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});


