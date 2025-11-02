document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blog-form');
    const blogPostsContainer = document.getElementById('blog-posts');
    const postTitle = document.getElementById('post-title');
    const postContentHtml = document.getElementById('post-content-html'); // For rendered HTML
    const searchBar = document.getElementById('search-bar');
    const themeToggle = document.getElementById('theme-toggle');

    let allPosts = [];

    // Theme switching logic
    const enableDarkMode = () => {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    };

    const disableDarkMode = () => {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    };

    if (themeToggle) {
        // Set initial theme based on localStorage
        if (localStorage.getItem('theme') === 'dark') {
            enableDarkMode();
        } else {
            disableDarkMode();
        }

        themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        });
    }

    // Debounce utility to limit function calls
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    // Get sort controls and attach listeners
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');

    const sortPosts = () => {
        if (!allPosts || allPosts.length === 0) return;

        const sortBy = sortBySelect ? sortBySelect.value : 'timestamp';
        const sortOrder = sortOrderSelect ? sortOrderSelect.value : 'desc';

        allPosts.sort((a, b) => {
            let valA, valB;

            if (sortBy === 'title') {
                valA = a.title.toLowerCase();
                valB = b.title.toLowerCase();
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            } else if (sortBy === 'timestamp') {
                valA = new Date(a.timestamp).getTime();
                valB = new Date(b.timestamp).getTime();
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });
        displayDashboardPosts(searchBar ? searchBar.value : '');
    };

    if (sortBySelect) {
        sortBySelect.addEventListener('change', sortPosts);
    }
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', sortPosts);
    }

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
                <h2><a href="/viewer?id=${post.id}">${post.title}</a></h2>
                <p class="post-snippet">${snippet}</p>
                <div class="button-group">
                    <a href="/editor?id=${post.id}" style="font-size: 0.9rem; color: #6b6b6b; text-decoration: none;">Edit</a>
                    <a href="#" class="delete-button" data-id="${post.id}" style="font-size: 0.9rem; color: #c94a4a; text-decoration: none; margin-left: 1rem;">Delete</a>
                </div>
            `;
            blogPostsContainer.appendChild(postElement);
        });

        // Event delegation for delete buttons
        blogPostsContainer.removeEventListener('click', handleDeleteButtonClick); // Remove old listener if exists
        blogPostsContainer.addEventListener('click', handleDeleteButtonClick);
    };

    const handleDeleteButtonClick = async (e) => {
        if (e.target.classList.contains('delete-button')) {
            e.preventDefault();
            const postId = e.target.getAttribute('data-id');
            const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchAndDisplayPosts();
                showFlashMessage('Post moved to bin successfully.', 'success');
            } else {
                showFlashMessage('Failed to delete post.', 'error');
            }
        }
    };

    const fetchAndDisplayPosts = async () => {
        try {
            const response = await fetch('/api/posts');
            allPosts = await response.json();
            sortPosts(); // Sort posts after fetching
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            if (blogPostsContainer) {
                blogPostsContainer.innerHTML = '<p>Could not load posts. Is the server running?</p>';
                showFlashMessage('Could not load posts. Is the server running?', 'error');
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



                // Display metadata
                document.getElementById('post-author').textContent = post.author;
                const wordsPerMinute = 200; // Average reading speed
                const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;
                const readingTime = Math.ceil(wordCount / wordsPerMinute);
                document.getElementById('post-reading-time').textContent = `${readingTime} min read`;

                const postTimestamp = document.getElementById('post-timestamp');
                if (postTimestamp) {
                    const date = new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    postTimestamp.textContent = date;
                }
            } catch (error) {
                postTitle.textContent = "Error";
                postContentHtml.innerHTML = "<p>Could not find the requested post.</p>";
                showFlashMessage('Could not find the requested post.', 'error');
            }
        }
    };

    const updateEditorMeta = (content = '') => {
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        const readingTime = Math.ceil(wordCount / 200);

        document.getElementById('word-count').textContent = `Words: ${wordCount}`;
        document.getElementById('reading-time').textContent = `Reading time: ${readingTime} min`;
    };

    const autoExpandTitle = () => {
        const titleTextarea = document.getElementById('title');
        if (titleTextarea) {
            titleTextarea.style.height = 'auto';
            titleTextarea.style.height = titleTextarea.scrollHeight + 'px';
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

        const titleTextarea = document.getElementById('title');
        if (titleTextarea) {
            titleTextarea.addEventListener('input', autoExpandTitle);
        }

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

                    updateEditorMeta(post.content);
                    autoExpandTitle(); // Expand title on load
                });
        } else {
            autoExpandTitle(); // Expand title for new posts
        }

        // Update word count on editor changes (debounced)
        const debouncedUpdateEditorMeta = debounce(updateEditorMeta, 300); // Debounce by 300ms
        easyMDE.codemirror.on("change", () => {
            debouncedUpdateEditorMeta(easyMDE.value());
        });

        document.getElementById('save-post-button').addEventListener('click', async () => {
            const title = document.getElementById('title').value;
            const content = easyMDE.value(); // Get content from EasyMDE instance
            const author = document.getElementById('author').value;
            const email = document.getElementById('email').value;
            
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            const url = postId ? `/api/posts/${postId}` : '/api/posts';
            const method = postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, author, email }),
            });

            if (response.ok) {
                const responseData = await response.json();
                const newPostId = responseData.id; // Assuming the backend returns the new post ID
                window.location.href = `/viewer?id=${newPostId}`;
            } else {
                const error = await response.json();
                showFlashMessage(`Error: ${error.message}`, 'error');
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

    // Fetch and display flash messages from the backend
    const fetchFlashMessages = async () => {
        try {
            const response = await fetch('/api/flash-messages');
            if (response.ok) {
                const flash = await response.json();
                if (flash && flash.message) {
                    showFlashMessage(flash.message, flash.type);
                }
            }
        } catch (error) {
            console.error('Error fetching flash messages:', error);
        }
    };

    fetchFlashMessages();

    // Handle subscription form submission
    const subscriptionForm = document.getElementById('subscription-form');

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-subscribe');
            const email = emailInput.value;

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const result = await response.json();

                if (response.ok) {
                    showFlashMessage(result.message, 'success');
                    emailInput.value = ''; // Clear the input field
                } else {
                    showFlashMessage(result.message || 'Subscription failed.', 'error');
                }
            } catch (error) {
                console.error('Error subscribing:', error);
                showFlashMessage('An error occurred. Please try again.', 'error');
            }
        });
    }
});
