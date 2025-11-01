document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blog-form');
    const blogPostsContainer = document.getElementById('blog-posts');
    const postTitle = document.getElementById('post-title');
    const postContentHtml = document.getElementById('post-content-html'); // For rendered HTML
    const searchBar = document.getElementById('search-bar');

    let allPosts = [];

    const fontSizeMap = {
        'Very Small': '0.8em',
        'Small': '1em',
        'Medium': '1.2em',
        'Large': '1.5em',
        'Very Large': '2em',
    };

    const displayDashboardPosts = (filter = '') => {
        if (!blogPostsContainer) return;
        blogPostsContainer.innerHTML = '';
        const filteredPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(filter.toLowerCase()) ||
            post.content.toLowerCase().includes(filter.toLowerCase())
        );

        filteredPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post-list-item');
            const snippet = post.content.substring(0, 120) + (post.content.length > 120 ? '...' : '');
            const postDate = new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            postElement.innerHTML = `
                <div class="post-meta-info">
                    <span>${post.author}</span>
                    <span style="margin: 0 0.5rem;">·</span>
                    <span>${postDate}</span>
                </div>
                <h2><a href="viewer.html?id=${post.id}">${post.title}</a></h2>
                <p class="post-snippet">${snippet}</p>
                <div class="button-group">
                    <a href="editor.html?id=${post.id}" style="font-size: 0.9rem; color: #6b6b6b; text-decoration: none;">Edit</a>
                    <a href="#" class="delete-button" data-id="${post.id}" style="font-size: 0.9rem; color: #c94a4a; text-decoration: none; margin-left: 1rem;">Delete</a>
                </div>
            `;
            blogPostsContainer.appendChild(postElement);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to move this post to the bin?')) {
                    const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
                    if (response.ok) {
                        fetchAndDisplayPosts();
                    } else {
                        alert('Failed to delete post.');
                    }
                }
            });
        });
    };

    const fetchAndDisplayPosts = async () => {
        try {
            const response = await fetch('/api/posts');
            allPosts = await response.json();
            displayDashboardPosts(searchBar ? searchBar.value : '');
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            if (blogPostsContainer) {
                blogPostsContainer.innerHTML = '<p>Could not load posts. Is the server running?</p>';
            }
        }
    };

    const displayPost = async () => {
        if (!postTitle || !postContentHtml) return;
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        if (postId) {
            try {
                const response = await fetch(`/api/posts/${postId}`);
                if (!response.ok) throw new Error('Post not found');
                const post = await response.json();
                postTitle.textContent = post.title;

                // Render Markdown using markdown-it
                const md = window.markdownit();
                postContentHtml.innerHTML = md.render(post.content);

                // Apply font styles
                if (post.fontFamily) {
                    postContentHtml.style.fontFamily = post.fontFamily;
                }
                if (post.fontSize && fontSizeMap[post.fontSize]) {
                    postContentHtml.style.fontSize = fontSizeMap[post.fontSize];
                }

                // Display metadata
                document.getElementById('post-author').textContent = `By: ${post.author}`;
                document.getElementById('post-email').textContent = `Email: ${post.email}`;
                const postTimestamp = document.getElementById('post-timestamp');
                if (postTimestamp) {
                    const date = new Date(post.timestamp).toLocaleString();
                    postTimestamp.textContent = `Last updated: ${date}`;
                }
            } catch (error) {
                postTitle.textContent = "Error";
                postContentHtml.innerHTML = "<p>Could not find the requested post.</p>";
            }
        }
    };

    const updateEditorMeta = (content = '') => {
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        const readingTime = Math.ceil(wordCount / 200);

        document.getElementById('word-count').textContent = `Words: ${wordCount}`;
        document.getElementById('reading-time').textContent = `Reading time: ${readingTime} min`;
    };

    const populateFontDropdowns = async () => {
        const fontFamilySelect = document.getElementById('font-family');
        const fontSizeSelect = document.getElementById('font-size');

        // Populate font sizes with descriptive terms
        const fontSizes = Object.keys(fontSizeMap);

        fontSizes.forEach(sizeText => {
            const option = document.createElement('option');
            option.value = sizeText;
            option.textContent = sizeText;
            fontSizeSelect.appendChild(option);
        });

        // Fetch and populate font families
        try {
            const response = await fetch('/api/settings/fonts');
            const fonts = await response.json();
            fonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                fontFamilySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load fonts:', error);
        }
    };

    if (blogForm) {
        let easyMDE; // To hold the editor instance

        // Initialize EasyMDE
        const contentTextArea = document.getElementById('content');
        easyMDE = new EasyMDE({
            element: contentTextArea,
            spellChecker: false,
            placeholder: "Start writing your blog post in Markdown...",
            minHeight: "300px",
        });

        populateFontDropdowns(); // Call the new function

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (postId) {
            fetch(`/api/posts/${postId}`)
                .then(res => res.json())
                .then(post => {
                    document.getElementById('title').value = post.title;
                    document.getElementById('author').value = post.author;
                    document.getElementById('email').value = post.email;
                    easyMDE.value(post.content); // Use EasyMDE's method to set content
                    // Set dropdown values after a short delay to ensure options are populated
                    setTimeout(() => {
                        document.getElementById('font-family').value = post.fontFamily || '';
                        document.getElementById('font-size').value = post.fontSize || '';
                    }, 100);
                    updateEditorMeta(post.content);
                });
        }

        // Update word count on editor changes
        easyMDE.codemirror.on("change", () => {
            updateEditorMeta(easyMDE.value());
        });

        document.getElementById('save-post-button').addEventListener('click', async () => {
            const title = document.getElementById('title').value;
            const content = easyMDE.value(); // Get content from EasyMDE instance
            const author = document.getElementById('author').value;
            const email = document.getElementById('email').value;
            const fontFamily = document.getElementById('font-family').value;
            const fontSize = document.getElementById('font-size').value;
            
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            const url = postId ? `/api/posts/${postId}` : '/api/posts';
            const method = postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, author, email, fontFamily, fontSize }),
            });

            if (response.ok) {
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        });
    }

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            displayDashboardPosts(e.target.value);
        });
    }

    // Initial load
    if (blogPostsContainer) {
        fetchAndDisplayPosts();
    }
    displayPost();
});
