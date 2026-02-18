require('dotenv').config();

require("./models/Admin")
require("./models/Upload")


const bcrypt = require("bcrypt")
const Admin = require("./models/Admin")

const jwt = require("jsonwebtoken")
const auth = require("./middleware/auth")



const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("./cloudinary")
const Upload = require("./models/Upload")


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Sample schema & model (you can delete this later)
const sampleSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const Sample = mongoose.model('Sample', sampleSchema);

// Enable JSON parsing
app.use(express.json());


app.use(cors({
  origin: "https://filevault-admin.vercel.app",
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));


// Multer Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    resource_type: "auto"
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});


// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running on port 5000' });
});

app.post('/upload', async (req, res) => {
  console.time("UploadTime");

  try {
    const { type, filename, filepath, fileSize, content } = req.body;

    if (type === "file") {
      const newUpload = await Upload.create({
        type,
        filename,
        filepath,
        fileSize,
      });

      console.timeEnd("UploadTime");
      return res.json({ message: "File saved successfully", data: newUpload });
    }

    if (type === "text") {
      const newUpload = await Upload.create({
        type,
        content,
      });

      console.timeEnd("UploadTime");
      return res.json({ message: "Text saved successfully", data: newUpload });
    }

    console.timeEnd("UploadTime");
    return res.status(400).json({ message: "Invalid data" });

  } catch (error) {
    console.timeEnd("UploadTime");
    console.log(error);
    res.status(500).json({ message: "Upload failed" });
  }
});



app.post("/admin/register", async (req, res) => {
    try {
      const { username, password } = req.body
  
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" })
      }
  
      const existingAdmin = await Admin.findOne({ username })
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" })
      }
  
      const hashedPassword = await bcrypt.hash(password, 10)
  
      const newAdmin = await Admin.create({
        username,
        password: hashedPassword
      })
  
      res.json({ message: "Admin created successfully" })
  
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Error creating admin" })
    }
  })


  app.post("/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body
  
      const admin = await Admin.findOne({ username })
      if (!admin) {
        return res.status(400).json({ message: "Invalid credentials" })
      }
  
      const isMatch = await bcrypt.compare(password, admin.password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }
  
      const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      )
  
      res.json({ token })
  
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Login failed" })
    }
  })

  app.get("/admin/uploads", auth, async (req, res) => {
    try {
      const uploads = await Upload.find().sort({ uploadedAt: -1 })
      res.json(uploads)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Failed to fetch uploads" })
    }
  })

  

app.get("/admin/download/:id", auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id)

    if (!upload || upload.type !== "file") {
      return res.status(404).json({ message: "File not found" })
    }

    res.redirect(upload.filepath)

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Download failed" })
  }
})


app.delete("/admin/upload/:id", auth, async (req, res) => {
    try {
      const upload = await Upload.findById(req.params.id)
  
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" })
      }
  
      await upload.deleteOne()
  
      res.json({ message: "Upload deleted" })
  
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Delete failed" })
    }
  })

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



