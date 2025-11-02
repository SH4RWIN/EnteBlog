require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const nodemailer = require('nodemailer');
const session = require('express-session');

const app = express();
const PORT = 3000;
const POSTS_DIR = path.join(__dirname, 'posts');
const BIN_DIR = path.join(__dirname, 'bin');
const SETTINGS_DIR = path.join(__dirname, 'settings');
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // Use a strong secret from .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Middleware to make flash messages available
app.use((req, res, next) => {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

// Nodemailer transporter setup
// IMPORTANT: For production, use environment variables for EMAIL_USER and EMAIL_PASS
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password (not your regular password)
    }
});

// Function to send email notifications to subscribers
const sendNewPostNotification = async (postTitle, postLink) => {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        const subscribers = JSON.parse(data);

        if (subscribers.length === 0) {
            console.log("No subscribers to notify.");
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            bcc: subscribers.join(','), // Send to all subscribers as BCC
            subject: `New Blog Post: ${postTitle}`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Blog Post from Verbius</title>
    <style>
        body {
            font-family: sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #242424;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #f0f0f0;
        }
        .header {
            background-color: #ffffff;
            padding: 20px 30px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #242424;
            font-weight: 700;
        }
        .content {
            padding: 30px;
            text-align: left;
        }
        .content h2 {
            color: #242424;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333333;
        }
        .button-container {
            margin-top: 25px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #242424;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 999px; /* Pill shape */
            font-size: 15px;
            font-weight: 500;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #000000;
        }
        .footer {
            background-color: #ffffff;
            color: #888888;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #f0f0f0;
        }
        .footer a {
            color: #6b6b6b;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }

        /* Responsive Styles */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
                border-left: none !important;
                border-right: none !important;
            }
            .header, .content, .footer {
                padding: 15px 20px !important;
            }
            .header h1 {
                font-size: 20px !important;
            }
            .content h2 {
                font-size: 18px !important;
            }
            .content p {
                font-size: 14px !important;
            }
            .button {
                padding: 8px 18px !important;
                font-size: 13px !important;
            }
        }
    </style>
</head>
<body style="font-family: sohne, 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #242424; background-color: #f9f9f9; margin: 0; padding: 0;">
    <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #f0f0f0;">
        <header class="header" style="background-color: #ffffff; padding: 20px 30px; text-align: left; border-bottom: 1px solid #f0f0f0;">
            <h1 style="margin: 0; font-size: 24px; color: #242424; font-weight: 700;">Verbius</h1>
        </header>
        <main class="content" style="padding: 30px; text-align: left;">
            <h2 style="color: #242424; font-size: 22px; margin-bottom: 15px; font-weight: 700;">New Blog Post Published!</h2>
            <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">A new article titled "<strong>${postTitle}</strong>" has just been published on Verbius.</p>
            <div class="button-container" style="margin-top: 25px; text-align: center;">
                <a href="${postLink}" class="button" style="display: inline-block; background-color: #242424; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 999px; font-size: 15px; font-weight: 500; transition: background-color 0.3s ease;">Read the Full Post</a>
            </div>
            <p style="font-size: 14px; margin-top: 30px; color: #666666;">We hope you enjoy reading it!</p>
        </main>
        <footer class="footer" style="background-color: #ffffff; color: #888888; padding: 20px 30px; text-align: center; font-size: 12px; border-top: 1px solid #f0f0f0;">
            <p>&copy; 2025 Verbius. All rights reserved.</p>
            <p>
                <a href="${process.env.FRONTEND_URL}/blogs" style="color: #6b6b6b; text-decoration: none;">Visit Verbius</a>
            </p>
        </footer>
    </div>
</body>
</html>
`
        };

        await transporter.sendMail(mailOptions);
        console.log(`New post notification sent for: ${postTitle}`);
    } catch (error) {
        console.error("Error sending new post notification:", error);
    }
};

// Ensure directories exist
fs.mkdir(POSTS_DIR, { recursive: true });
fs.mkdir(BIN_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Serve specific HTML files for clean URLs
app.get('/blogs', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/blogs.html'));
});

app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/viewer.html'));
});

app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/editor.html'));
});

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/welcome.html'));
});

app.get('/', (req, res) => {
    res.redirect('/welcome');
});

// GET /api/settings/fonts - Get the list of supported fonts
app.get('/api/settings/fonts', async (req, res) => {
    try {
        const fontsFile = await fs.readFile(path.join(SETTINGS_DIR, 'fonts.yml'), 'utf8');
        const fonts = yaml.load(fontsFile);
        res.json(fonts);
    } catch (error) {
        res.status(500).json({ message: "Could not load font settings." });
    }
});

// GET /api/flash-messages - Retrieve and clear flash messages
app.get('/api/flash-messages', (req, res) => {
    const flash = req.session.flash || {}; // Ensure flash is always an object
    if (req.session.flash) {
        req.session.flash = null; // Clear flash messages after retrieval
    }
    res.json(flash);
});

// POST /api/subscribe - Subscribe a new email
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const subscribersPath = path.join(__dirname, 'subscribers.json');

    try {
        let subscribers = [];
        try {
            const data = await fs.readFile(subscribersPath, 'utf8');
            subscribers = JSON.parse(data);
        } catch (readError) {
            // If file doesn't exist or is empty, start with an empty array
            if (readError.code === 'ENOENT' || subscribers.length === 0) {
                subscribers = [];
            } else {
                throw readError; // Re-throw other errors
            }
        }

        if (subscribers.includes(email)) {
            return res.status(409).json({ message: "Email already subscribed." });
        }

        subscribers.push(email);
        await fs.writeFile(subscribersPath, JSON.stringify(subscribers, null, 2));
        res.status(200).json({ message: "Thank you for subscribing!" });
    } catch (error) {
        console.error("Error subscribing email:", error);
        res.status(500).json({ message: "Failed to subscribe email." });
    }
});

const titleToDirname = (title) => {
    return title
        .trim() // Trim leading/trailing whitespace
        .toLowerCase()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^\w-]+/g, ''); // Remove invalid filename characters
};

// GET /api/posts - List all posts
app.get('/api/posts', async (req, res) => {
    try {
        const postDirs = await fs.readdir(POSTS_DIR);
        const posts = [];
        for (const dirName of postDirs) {
            const detailsPath = path.join(POSTS_DIR, dirName, 'details.json');
            const contentPath = path.join(POSTS_DIR, dirName, 'content.md');
            try {
                const detailsContent = await fs.readFile(detailsPath, 'utf8');
                const content = await fs.readFile(contentPath, 'utf8');
                const details = JSON.parse(detailsContent);
                posts.push({ ...details, id: dirName, content });
            } catch (error) {
                // Skip directories that don't contain valid post files
                console.error(`Skipping invalid post directory: ${dirName}`);
            }
        }
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error reading posts directory." });
    }
});

// GET /api/posts/:id - Get a single post
app.get('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const detailsPath = path.join(POSTS_DIR, id, 'details.json');
    const contentPath = path.join(POSTS_DIR, id, 'content.md');
    try {
        const detailsContent = await fs.readFile(detailsPath, 'utf8');
        const content = await fs.readFile(contentPath, 'utf8');
        const details = JSON.parse(detailsContent);
        res.json({ ...details, id, content });
    } catch (error) {
        res.status(404).json({ message: "Post not found." });
    }
});

// POST /api/posts - Create a new post
app.post('/api/posts', async (req, res) => {
    const { title, content, authorName, authorEmail } = req.body;
    if (!title || !content || !authorName || !authorEmail) {
        return res.status(400).json({ message: "Title, content, author name, and author email are required." });
    }

    const dirName = titleToDirname(title);
    const postPath = path.join(POSTS_DIR, dirName);

    try {
        await fs.access(postPath);
        return res.status(409).json({ message: "A post with this title already exists." });
    } catch (error) {
        // Directory does not exist, proceed
        await fs.mkdir(postPath);
        const details = {
            title,
            authorName,
            authorEmail,
            timestamp: new Date().toISOString(),
        };
        await fs.writeFile(path.join(postPath, 'details.json'), JSON.stringify(details, null, 2));
        await fs.writeFile(path.join(postPath, 'content.md'), content);

        // Send email notification to subscribers
        const postLink = `${process.env.FRONTEND_URL}/viewer?id=${dirName}`;
        sendNewPostNotification(title, postLink);

        req.session.flash = { message: 'Blog post published successfully!', type: 'success' };
        res.status(201).json({ ...details, id: dirName, content });
    }
});

// PUT /api/posts/:id - Update a post
app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, authorName, authorEmail } = req.body;
    const oldPostPath = path.join(POSTS_DIR, id);

    try {
        await fs.access(oldPostPath);
        const newDirname = titleToDirname(title);
        const newPostPath = path.join(POSTS_DIR, newDirname);

        if (id !== newDirname) {
            try {
                await fs.access(newPostPath);
                return res.status(409).json({ message: "A post with the new title already exists." });
            } catch (error) {
                await fs.rename(oldPostPath, newPostPath);
            }
        }

        const details = {
            title,
            authorName,
            authorEmail,
            timestamp: new Date().toISOString(), // This is now the "last edited" time
        };
        await fs.writeFile(path.join(newPostPath, 'details.json'), JSON.stringify(details, null, 2));
        await fs.writeFile(path.join(newPostPath, 'content.md'), content);

        req.session.flash = { message: 'Blog post updated successfully!', type: 'success' };
        res.json({ ...details, id: newDirname, content });

    } catch (error) {
        res.status(404).json({ message: "Post not found." });
    }
});

// DELETE /api/posts/:id - Move a post to the bin
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const postPath = path.join(POSTS_DIR, id);
    const binPath = path.join(BIN_DIR, id);

    try {
        // If a directory with the same ID already exists in the bin, remove it first
        try {
            await fs.rm(binPath, { recursive: true, force: true });
        } catch (err) {
            // Ignore error if the directory doesn't exist (ENOENT)
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        await fs.rename(postPath, binPath);
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting post ${id}:`, error);
        res.status(404).json({ message: "Post not found." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//test