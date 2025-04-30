const nodemailer = require("nodemailer");

// Configure nodemailer transport (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like Outlook, Yahoo, etc.
  auth: {
    user: "your-email@gmail.com", // Replace with your email
    pass: "your-email-password",   // Replace with your email password or app password
  },
});

// Function to send the confirmation email
const sendConfirmationEmail = (to, bookingDetails) => {
  const mailOptions = {
    from: "your-email@gmail.com", // Your email
    to: to, // Recipient's email
    subject: "Booking Confirmation - Hotel Reservation",
    text: `Dear ${bookingDetails.name},

    Your booking has been confirmed for the hotel: ${bookingDetails.hotelName}.
    
    Details:
    - Check-in Date: ${bookingDetails.checkInDate}
    - Check-out Date: ${bookingDetails.checkOutDate}
    - Number of Adults: ${bookingDetails.adults}
    - Number of Kids: ${bookingDetails.kids}
    
    Thank you for choosing us!

    Best regards,
    Hotel Booking Team`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// Endpoint to handle the booking request
app.post("/bookings", (req, res) => {
  const { name, email, hotelName, checkInDate, checkOutDate, adults, kids } = req.body;

  // Insert booking details into the database
  const query = `INSERT INTO bookings (name, email, hotel_name, check_in_date, check_out_date, adults, kids) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [name, email, hotelName, checkInDate, checkOutDate, adults, kids], (err, result) => {
    if (err) {
      console.error("Error saving booking:", err);
      return res.status(500).json({ message: "Booking failed! Please try again." });
    }

    console.log("Booking saved:", result);

    // Send the confirmation email
    sendConfirmationEmail(email, {
      name,
      hotelName,
      checkInDate,
      checkOutDate,
      adults,
      kids,
    });

    res.status(200).json({ message: "Booking confirmed!" });
  });
});
