const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json()); 

const http = require('http');
const server = http.createServer(app);

const PDFDocument = require("pdfkit");
const fs = require("fs");

const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/'; 

mongoose.connect(mongoUri)
    .then(() => {
        console.log('🔗 Successfully connected to MongoDB!');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });

const poojaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        default: 'Date not specified'
    },
    timing: {
        type: String,
        default: 'Time not specified'
    },
    details: {
        type: String,
        default: 'No details provided'
    }
}, 
{
    timestamps: true 
});

const Pooja = mongoose.model('Pooja', poojaSchema);

app.post('/api/poojas', async (req, res) => {
    const { name, date, timing, details } = req.body; 


    if (!name) {
        return res.status(400).json({ error: 'Pooja name is required' });
    }

    try {
       
        const newPooja = new Pooja({
            name,
            date: date || undefined, 
            timing: timing || undefined,
            details: details || undefined
        });

    
        const savedPooja = await newPooja.save();

        console.log('\n==========================================');
        console.log('✅ New Pooja Booking Confirmed (MongoDB)');
        console.log(`ID: ${savedPooja._id}`); 
        console.log(`Pooja Name: ${savedPooja.name}`);
        console.log(`Date: ${savedPooja.date}`);
        console.log(`Timing: ${savedPooja.timing}`);
        console.log(`Details: ${savedPooja.details}`);
        console.log(`Booked At: ${savedPooja.createdAt}`);
        console.log('==========================================');

        res.status(201).json(savedPooja);
    } catch (error) {
        console.error('❌ Error saving pooja:', error);
        res.status(500).json({ error: 'Failed to create pooja booking.' });
    }
});




app.get('/api/poojas', async (req, res) => {
    try {
        
        const allPoojas = await Pooja.find({}); 
        res.status(200).json(allPoojas);
    } catch (error) {
        console.error('❌ Error fetching poojas:', error);
        res.status(500).json({ error: 'Failed to retrieve pooja bookings.' });
    }
});
app.delete('/api/poojas/:id', async (req, res) => {
    const poojaId = req.params.id;

    try {
        const deletedPooja = await Pooja.findByIdAndDelete(poojaId);

        if (!deletedPooja) return res.status(404).json({ error: 'Pooja not found' });

        console.log(`🗑️ Pooja Deleted: ${deletedPooja._id}`);
        res.status(200).json({ message: 'Pooja deleted successfully' });

    } catch (error) {
        console.error('❌ Error deleting pooja:', error);
        res.status(500).json({ error: 'Failed to delete pooja.' });
    }
});

app.put('/api/poojas/:id', async (req, res) => {
    const poojaId = req.params.id;

    const updateData = req.body || {};

    console.log("📩 Received Body:", updateData);

    try {
      
        if (Object.keys(updateData).length === 0) {
            console.log("⚠️ No fields provided for update, skipping body validation…");
        }

        const updatedPooja = await Pooja.findByIdAndUpdate(
            poojaId,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPooja) {
            return res.status(404).json({ error: "Pooja not found with given ID" });
        }

        res.status(200).json({
            message: "Pooja updated successfully",
            updatedPooja
        });

    } catch (error) {
        console.error("❌ Update Error:", error);
        res.status(500).json({ error: "Failed to update pooja" });
    }
});

app.post("/api/admin/settings", async (req, res) => {
    try {
        const data = req.body;
        console.log("Settings Updated →", data);

        res.json({ message: "Settings saved successfully" });

    } catch (error) {
        res.status(500).json({ error: "Failed to save settings" });
    }
});


app.put('/api/poojas/:id/approve', async (req, res) => {
    const poojaId = req.params.id;
   
    if (!mongoose.Types.ObjectId.isValid(poojaId)) {
        return res.status(400).json({ error: "Invalid Pooja ID format" });
    }
    

    try {
        const updated = await Pooja.findByIdAndUpdate(
            poojaId,
            { $set: { status: 'approved' } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Pooja not found" });
        console.log(`✅ Pooja Approved: ${updated._id}`);
        res.json({ message: "Pooja approved successfully", pooja: updated });
    } catch (err) {
        console.error('❌ Approve Error:', err);
        res.status(500).json({ error: "Failed to approve pooja" });
    }
});


app.put('/api/poojas/:id/reject', async (req, res) => {
    const poojaId = req.params.id;

 
    if (!mongoose.Types.ObjectId.isValid(poojaId)) {
        return res.status(400).json({ error: "Invalid Pooja ID format" });
    }
    
    try {
        const updated = await Pooja.findByIdAndUpdate(
            poojaId,
            { $set: { status: 'rejected' } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Pooja not found" });
        console.log(`❌ Pooja Rejected: ${updated._id}`);
        res.json({ message: "Pooja rejected successfully", pooja: updated });
    } catch (err) {
        console.error('❌ Reject Error:', err);
        res.status(500).json({ error: "Failed to reject pooja" });
    }
});


app.get('/api/poojas/approved', async (req, res) => {
    try {
        const approvedPoojas = await Pooja.find({ status: 'approved' });
        res.json(approvedPoojas);
    } catch (err) {
        console.error('❌ Fetch Approved Error:', err);
        res.status(500).json({ error: "Failed to fetch approved poojas" });
    }
});


app.get('/api/poojas/pending', async (req, res) => {
    try {
        const pendingPoojas = await Pooja.find({ status: 'pending' });
        res.json(pendingPoojas);
    } catch (err) {
        console.error('❌ Fetch Pending Error:', err);
        res.status(500).json({ error: "Failed to fetch pending poojas" });
    }
});


const panditSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Pandit = mongoose.model('Pandit', panditSchema);



app.post("/api/pandit/login", async (req, res) => {
    const { username, password } = req.body;

    try {
       
        const user = await Pandit.findOne({ username: username.trim() });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

       
        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const userData = user.toObject();
        delete userData.password;  

        res.status(200).json({
            message: "Login successful",
            user: userData
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});





app.post("/api/pandit/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await Pandit.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });


        const hashedPassword = await bcrypt.hash(password, 10);

        const newPandit = new Pandit({ username, password: hashedPassword });
        await newPandit.save();

        res.status(201).json({ message: "Pandit registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


app.get("/api/pandit/all", async (req, res) => {
    try {
        const users = await Pandit.find(); 
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastLogin: { type: Date }
});

const Admin = mongoose.model("Admin", adminSchema);

(async () => {
    try {
        const existingAdmin = await Admin.findOne({ username: "admin" });
        if (!existingAdmin) {
            await new Admin({ username: "admin", password: "admin123" }).save();
            console.log("✅ Initial admin created!");
        }
    } catch (err) {
        console.error("❌ Admin setup error:", err);
    }
})();

app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    try {
        const admin = await Admin.findOne({ username });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        admin.lastLogin = new Date();
        await admin.save();

        res.status(200).json({ message: "Login successful", lastLogin: admin.lastLogin });
    } catch (err) {
        console.error("❌ Admin login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/api/admin/logout", (req, res) => {
    res.status(200).json({ message: "Admin logged out successfully" });
});

app.get("/api/admin/pandits", async (req, res) => {
    try {
        const users = await Pandit.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});




app.get("/api/user/bookings/:username", async (req, res) => {
    try {
        const history = await Pooja.find({ username: req.params.username });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});


app.get("/api/user/receipts/:id", async (req, res) => {
    try {
        const receipt = await Pooja.findById(req.params.id);
        res.json({
            receiptId: receipt._id,
            poojaName: receipt.name,
            date: receipt.date,
            timing: receipt.timing,
            bookedOn: receipt.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch receipt" });
    }
});


app.get("/api/user/prasad/:id", async (req, res) => {
    try {
        const pooja = await Pooja.findById(req.params.id);
        res.json({
            poojaId: pooja._id,
            prasadStatus: pooja.status === "approved" ? "Dispatched" : "Pending"
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch prasad status" });
    }
});


app.get("/api/user/upcoming", async (req, res) => {
    try {
        const upcoming = await Pooja.find({ status: "approved" });
        res.json(upcoming);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch upcoming poojas" });
    }
});
const citySchema = new mongoose.Schema({
    name: { type: String, required: true }
});

const City = mongoose.model("City", citySchema);

app.get("/api/cities", async (req, res) => {
    try {
        const cities = await City.find();
        res.status(200).json(cities);
    } catch (err) {
        console.error("❌ Error loading cities:", err);
        res.status(500).json({ error: "Failed to load cities" });
    }
});


app.post("/api/cities", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: "City name required" });

        const newCity = new City({ name });
        await newCity.save();

        res.status(201).json({ message: "City added", city: newCity });
    } catch (err) {
        res.status(500).json({ error: "Failed to add city" });
    }
});

const messageSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model("Message", messageSchema);

app.post("/send-message", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.json({ success: false, message: "All required fields needed." });
        }

       
        const newMessage = new Message({ name, email, phone, message });
        await newMessage.save();

        console.log("📩 New Contact Message:");
        console.log(newMessage);

       
        res.json({
            success: true,
            message: "Message saved successfully"
        });

    } catch (err) {
        console.error("❌ Error sending message:", err);
        res.json({
            success: false,
            message: "Message sent successfully"
        });
    }
});







app.post("/api/meeting/create", async (req, res) => {
    try {
        const { title, userId } = req.body;

        if (!title || !userId) {
            return res.json({ success: false, message: "Title & User ID required" });
        }

        const meetingId = Math.random().toString(36).substring(2, 10);
        const meetingURL = `https://meet.jit.si/${meetingId}`;

        const meeting = new Meeting({
            title,
            createdBy: userId,
            participants: [userId],
            meetingId,
            meetingURL
        });

        await meeting.save();
        res.json({ success: true, meeting });

    } catch (e) {
        res.json({ success: false, message: "Server Error" });
    }
});




app.post("/api/meeting/request-pandit", async (req, res) => {
    const { meetingId, panditId } = req.body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.json({ success: false, message: "Meeting not found" });

    meeting.panditRequested = panditId;
    await meeting.save();

    res.json({ success: true, message: "Pandit request sent" });
});

app.post("/api/meeting/request-pandit" , async (req,res) => {
    const { meetngId , panditid } = req.body;

    const meeting = await Meeting.findOne({ success: false , message: "Meeting not found "});
    if (!meeting) return res.json({ success: false,message: "meeting not found"});

    meeting.panditRequested = panditID;
    await meeting.save();

    res.json({ success: true, message: "pandit request sent"});
} );


app.post("/api/meeting/pandit-approve", async (req, res) => {
    const { meetingId, approve, panditId } = req.body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.json({ success: false, message: "Meeting not found" });

    if (approve) {
        meeting.status = "approved";
        meeting.panditApproved = panditId;
    } else {
        meeting.status = "rejected";
    }

    await meeting.save();
    res.json({ success: true, meeting });
});




app.get("/api/meetings/user/:userId", async (req, res) => {
    const meetings = await Meeting.find({ participants: req.params.userId });
    res.json(meetings);
});



app.get("/api/meetings/pandit/:panditId", async (req, res) => {
    const meetings = await Meeting.find({ panditRequested: req.params.panditId });
    res.json(meetings);
});

const meetingSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    
    participants: [
        {
            userName: String,
            joinedAt: Date,
            leftAt: Date
        }
    ],

    messages: [
        {
            sender: String,
            message: String,
            time: String
        }
    ],

    events: [
        {
            type: String,   // join / leave / screen-share-start / screen-share-end / raise-hand
            user: String,
            time: String
        }
    ],

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
}, { timestamps: true });

const Meeting = mongoose.model("Meeting", meetingSchema);

app.post('/api/book', async (req, res) => {
    try {
        const { userName, panditName, meetingId, date, time, purpose } = req.body;

        if (!userName || !meetingId) {
            return res.json({ success: false, message: 'Name and Meeting ID are required' });
        }

        const newPooja = new Pooja({
            name: userName,
            date: date || 'Date not specified',
            timing: time || 'Time not specified',
            details: purpose || 'No purpose provided',
            status: 'pending'
        });

        await newPooja.save();

        // Also create a Meeting entry
        const meeting = new Meeting({
            title: purpose || 'Pooja Meeting',
            createdBy: userName,
            participants: [userName],
            panditRequested: panditName || '',
            meetingId,
            meetingURL: `https://meet.jit.si/${meetingId}`,
            status: 'pending'
        });

        await meeting.save();

        console.log(`✅ Booking saved for ${userName}, Meeting ID: ${meetingId}`);

        res.json({
            success: true,
            pooja: newPooja,
            meeting
        });

    } catch (err) {
        console.error('❌ Booking error:', err);
        res.json({ success: false, message: 'Failed to save booking' });
    }
});
io.on("connection", socket => {

  
    socket.on("join-room", async ({ roomId, userName }) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userName = userName;

       
        await Meeting.updateOne(
            { roomId },
            {
                $push: {
                    participants: { userName, joinedAt: new Date() },
                    events: { type: "join", user: userName, time: new Date() }
                }
            },
            { upsert: true }
        );

        console.log(`🟢 ${userName} joined room ${roomId}`);
    });

    // USER LEAVE
    socket.on("leave-room", async (roomId, userName) => {
        await Meeting.updateOne(
            { roomId },
            {
                $push: { events: { type: "leave", user: userName, time: new Date() } },
                $set: { endedAt: new Date() }
            }
        );
        console.log(`🔴 ${userName} left room ${roomId}`);
    });

    // CHAT MESSAGE
    socket.on("chat-message", async ({ roomId, sender, message }) => {

        await Meeting.updateOne(
            { roomId },
            {
                $push: {
                    messages: {
                        sender,
                        message,
                        time: new Date().toLocaleTimeString()
                    }
                }
            }
        );

        io.to(roomId).emit("chat-message", { sender, message });
    });

    // SCREEN SHARE START
    socket.on("screen-share-start", async ({ roomId, sender }) => {
        await Meeting.updateOne(
            { roomId },
            {
                $push: {
                    events: { type: "screen-share-start", user: sender, time: new Date() }
                }
            }
        );
    });

    // SCREEN SHARE END
    socket.on("screen-share-end", async ({ roomId, sender }) => {
        await Meeting.updateOne(
            { roomId },
            {
                $push: {
                    events: { type: "screen-share-end", user: sender, time: new Date() }
                }
            }
        );
    });

    // RAISE HAND
    socket.on("raise-hand", async ({ roomId, sender }) => {
        await Meeting.updateOne(
            { roomId },
            {
                $push: {
                    events: { type: "raise-hand", user: sender, time: new Date() }
                }
            }
        );
        socket.to(roomId).emit("raise-hand", { sender });
    });
});

app.get("/api/meetings", async (req, res) => {
    const meetings = await Meeting.find({});
    res.json(meetings);
});

app.get("/api/meetings/:roomId", async (req, res) => {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });

    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    res.json(meeting);
});

app.get("/api/receipt/pdf/:id", async (req, res) => {
    const booking = await Pooja.findById(req.params.id);

    if (!booking) return res.json({ error: "Booking not found" });

    const fileName = `receipt-${booking._id}.pdf`;
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    doc.text("Book My Yagna - Receipt", { align: "center" });
    doc.moveDown();
    doc.text(`Receipt ID: ${booking._id}`);
    doc.text(`Pooja Name: ${booking.name}`);
    doc.text(`Date: ${booking.date}`);
    doc.text(`Time: ${booking.timing}`);
    doc.text(`Booked On: ${booking.createdAt}`);
    
    doc.pipe(res);
    doc.end();
});
// // const nodemailer = require("nodemailer");

// // const mail = nodemailer.createTransport({
// //     service: "gmail",
// //     auth: {
// //         user: process.env.EMAIL,
// //         pass: process.env.APP_PASSWORD
// //     }
// // });

// function sendBookingEmail(email, data) {
//     mail.sendMail({
//         from: process.env.EMAIL,
//         to: email,
//         subject: "Your Pooja Booking is Confirmed",
//         text: `Pooja: ${data.name}, Date: ${data.date}`
//     });
// }

// const nodemailer = require("nodemailer");

// const mail = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.APP_PASSWORD
//     }
// });
// sendBookingEmail(userEmail, {
//     name: savedPooja.name,
//     date: savedPooja.date,
//     timing: savedPooja.timing,
//     details: savedPooja.details
// });


function sendBookingEmail(email, data) {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px;">

            <h2 style="color: #d35400; text-align:center;">
                🙏 Book My Yagna – Booking Confirmation
            </h2>

            <p style="font-size: 16px; color: #333;">
                Dear Devotee,
                <br><br>
                Your <strong>Pooja Booking</strong> has been successfully recorded.
            </p>

            <div style="background:#f0ead6; padding:15px; border-radius:8px; margin-top: 10px;">
                <p style="font-size: 15px; margin: 5px 0;">
                    <strong>Pooja Name:</strong> ${data.name}
                </p>
                <p style="font-size: 15px; margin: 5px 0;">
                    <strong>Date:</strong> ${data.date}
                </p>
                <p style="font-size: 15px; margin: 5px 0;">
                    <strong>Timing:</strong> ${data.timing || "Not specified"}
                </p>
                <p style="font-size: 15px; margin: 5px 0;">
                    <strong>Details:</strong> ${data.details || "No details provided"}
                </p>
            </div>

            <p style="font-size: 16px; margin-top: 20px; color:#333;">
                We will notify you once the Pandit confirms the booking.
            </p>

            <p style="text-align:center; margin-top: 30px; font-size: 14px; color:#555;">
                © 2025 Book My Yagna. All Rights Reserved.
            </p>

        </div>
    </div>
    `;

    mail.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Your Pooja Booking Confirmation – Book My Yagna",
        html: htmlContent
    }, (err, info) => {
        if (err) {
            console.log("❌ Email Error:", err);
        } else {
            console.log("📩 Email Sent:", info.response);
        }
    });
}
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String }, 
    createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model("Blog", blogSchema);
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/blogs/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads')); 
app.post("/api/blogs", upload.single("image"), async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title & content required" });
        }

        const imageUrl = req.file ? `/uploads/blogs/${req.file.filename}` : null;

        const newBlog = new Blog({
            title,
            content,
            imageUrl
        });

        await newBlog.save();

        res.status(201).json({
            success: true,
            message: "Blog added successfully",
            blog: newBlog
        });

    } catch (err) {
        console.error("❌ Blog Error:", err);
        res.status(500).json({ success: false, message: "Failed to add blog" });
    }
});
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: "Failed to load blogs" });
    }
});
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: "Error loading blog" });
    }
});

// app.delete("/api/blogs/:id", async (req , res) => {
//     try{
//          const delteted blog = await Blog.findByIdAndDelete(req.params.id);
//         if (!deletedBlog) return res.status(404).json({message: "blog not found"});
//         res.json({message: "blog deleted successfully"});
//     }catch (error){
//         res.status(500).json({message: "error deleting blog"});

//     }
// })


app.listen(port, () => {
    console.log(`\n==========================================`);
    console.log(`🎉 Server Running! Access at http://localhost:${port}`);
    console.log(`Pooja API: http://localhost:${port}/api/poojas`);
   console.log(`🎉 Server Running with Socket.io! http://localhost:${port}`);
    console.log(`==========================================`);
    console.log('Waiting for new bookings...');
});
