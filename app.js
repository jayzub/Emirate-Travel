const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const multer = require('multer');
const User = require('./models/User');
const Contact = require('./models/Contact');
const Post = require('./models/Post');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');


const app = express();
const PORT = process.env.PORT || 3000;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSsnzbNQ8y1NUvAGbFR5rjvitbs3iANoY",
    authDomain: "project3-6d77e.firebaseapp.com",
    projectId: "project3-6d77e",
    storageBucket: "project3-6d77e.appspot.com",
    messagingSenderId: "1014939903994",
    appId: "1:1014939903994:web:1fe7bb4f25e87e6062e643"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

// Set up memory storage for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('image');

// Check file type
function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas connection string
const mongoUrl = 'mongodb+srv://ibeakanmachikodiri:ibeakanmachikodiri@cluster0.pyeytra.mongodb.net/emiratetravel?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
    secret: '54321edcba09876',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUrl })
}));

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Set up storage engine for image uploads
// const storage = multer.diskStorage({
//     destination: './public/uploads/',
//     filename: function(req, file, cb){
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

// Initialize upload
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 1000000 }, // Limit file size to 1MB
//     fileFilter: function(req, file, cb){
//         checkFileType(file, cb);
//     }
// }).single('image');

// Set up multer for file uploads
// const upload = multer({
//     storage: multer.memoryStorage(), // Store files in memory buffer
//     limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
// }).single('image');

// Check file type
// function checkFileType(file, cb){
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);

//     if(mimetype && extname){
//         return cb(null, true);
//     } else {
//         cb('Error: Images Only!');
//     }
// }

// Routes

app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.redirect('/signup?message=Username already exists&type=danger');
        }
        
        const newUser = new User({ username, password });
        await newUser.save();
        res.redirect('/login?message=Signup successful! Please login.&type=success');
    } catch (error) {
        console.error(error);
        res.redirect('/signup?message=Error signing up&type=danger');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await user.comparePassword(password)) {
            req.session.userId = user._id;
            res.redirect('/?message=Logged in successfully&type=success');
        } else {
            res.redirect('/login?message=Invalid username or password&type=danger');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/login?message=Error logging in&type=danger');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
});

app.get('/', async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('index', { user, title: 'Emirate Travel Guide Homepage' });
});

app.get('/currency', isLoggedIn, async (req, res) => {
    res.render('currency', { title: 'Currency Exchange Comparison' });
});

app.get('/weather', isLoggedIn, async (req, res) => {
    res.render('weather', { title: 'Weather Info Dashboard' });
});

app.get('/timezone', isLoggedIn, async (req, res) => {
    res.render('timezone', { title: 'Timezone Comparison' });
});

app.get('/contact', isLoggedIn, async (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

app.post('/save-contact', isLoggedIn, async (req, res) => {
    const { fullName, email, message } = req.body;
    try {
        // Create a new instance of Contact model and save to MongoDB
        const newContact = new Contact({ fullName, email, message });
        await newContact.save();

        // Retrieve the logged-in user and associate the contact with their profile
        const user = await User.findById(req.session.userId);
        user.contacts.push(newContact._id); // Push the ID of the new contact
        await user.save();

        res.status(200).send('Contact form saved successfully!');
    } catch (error) {
        console.error('Error saving contact form:', error);
        res.status(500).send('Error saving contact form');
    }
});

app.get('/account', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('account', { user, title: 'Account' });
});

app.post('/update-credentials', isLoggedIn, async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.session.userId);
        if (await user.comparePassword(oldPassword)) {
            user.username = username;
            user.password = newPassword;
            await user.save();
            res.redirect('/account?message=Credentials updated successfully&type=success');
        } else {
            res.redirect('/account?message=Invalid current password&type=danger');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/account?message=Error updating credentials&type=danger');
    }
});

app.post('/delete-account', isLoggedIn, async (req, res) => {
    const { password } = req.body;
    try {
        const user = await User.findById(req.session.userId);
        if (await user.comparePassword(password)) {
            await User.deleteOne({ _id: req.session.userId });
            req.session.destroy((err) => {
                if (err) {
                    return console.log(err);
                }
                res.redirect('/login?message=Account deleted successfully&type=success');
            });
        } else {
            res.redirect('/account?message=Invalid password&type=danger');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/account?message=Error deleting account&type=danger');
    }
});

app.get('/destinations', isLoggedIn, async (req, res) => {
    try {
        const posts = await Post.find().sort({ created_at: -1 });
        res.render('destinations', { posts });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        const posts = await Post.find().sort({ created_at: -1 });
        res.render('dashboard', { posts });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Route to handle adding a post with image upload
app.post('/add-post', isLoggedIn, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send(err);
        }

        const { title, content } = req.body;

        try {
            let imageUrl = null;

            if (req.file) {
                // Create a reference to the location where the image will be stored
                const imageRef = ref(storage, `images/${Date.now()}_${req.file.originalname}`);

                // Upload the image buffer to Firebase Storage
                const metadata = {
                    contentType: req.file.mimetype,
                };
                await uploadBytes(imageRef, req.file.buffer, metadata);

                // Get the download URL
                imageUrl = await getDownloadURL(imageRef);
            }

            const newPost = new Post({
                title,
                content,
                image: imageUrl // Save the Firebase Storage URL in your database
            });

            await newPost.save();
            res.redirect('/dashboard');
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    });
});



app.post('/delete-post/:id', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    try {
        await Post.findByIdAndDelete(id);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
