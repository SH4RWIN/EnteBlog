const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const app = express();
const PORT = 3000;
const POSTS_DIR = path.join(__dirname, 'posts');
const BIN_DIR = path.join(__dirname, 'bin');
const SETTINGS_DIR = path.join(__dirname, 'settings');

// Ensure directories exist
fs.mkdir(POSTS_DIR, { recursive: true });
fs.mkdir(BIN_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Serve specific HTML files for clean URLs
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/viewer.html'));
});

app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/editor.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
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
    const { title, content, author, email } = req.body;
    if (!title || !content || !author || !email) {
        return res.status(400).json({ message: "Title, content, author, and email are required." });
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
            author,
            email,
            timestamp: new Date().toISOString(),
        };
        await fs.writeFile(path.join(postPath, 'details.json'), JSON.stringify(details, null, 2));
        await fs.writeFile(path.join(postPath, 'content.md'), content);
        res.status(201).json({ ...details, id: dirName, content });
    }
});

// PUT /api/posts/:id - Update a post
app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, author, email } = req.body;
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
            author,
            email,
            timestamp: new Date().toISOString(), // This is now the "last edited" time
        };
        await fs.writeFile(path.join(newPostPath, 'details.json'), JSON.stringify(details, null, 2));
        await fs.writeFile(path.join(newPostPath, 'content.md'), content);
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
        await fs.rename(postPath, binPath);
        res.status(204).send();
    } catch (error) {
        res.status(404).json({ message: "Post not found." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});