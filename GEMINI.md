# Blog Website Project

## Current Understanding:

The goal is to create a simple blog website for a single, implicit user with the following features:

1.  **User Pages:** The application will have three main pages:
    *   **Editor:** For creating new blog posts.
    *   **Viewer:** For displaying individual blog posts.
    *   **Dashboard:** For managing (editing or viewing) existing blog posts.
2.  **Blog Creation:** The user can create new blog posts via the "Editor" page.
3.  **Saving and Display:** Newly created blog posts will be saved and then displayed on the "Dashboard."
4.  **Dashboard Functionality:** From the "Dashboard," the user can either edit an existing blog post or view it.

## Recent Updates:

-   **Frontend Redesign (Medium.com Style):**
    -   **Theme:** Black text on a white background with a minimalist, typography-focused aesthetic.
    -   **Layout:** Simplified top navigation bar and a single-column content area.
    -   **Dashboard:** Redesigned post list to mimic Medium's feed, including author and date.
    -   **Button Color:** "New Post" button in the banner now has a distinct color.
-   **Backend Fixes & Enhancements:**
    -   **Race Condition:** Corrected a race condition in `server.js` to ensure directories are created before the server starts.
    -   **Filename Fix:** Corrected `titleToDirname` in `server.js` to prevent trailing underscores in directory names.
    -   **Author Details:** Added 'Author Name' and 'Author Email' fields to the editor and display in the viewer. The 'timestamp' now represents the 'last edited' time.
    -   **Font Customization:**
        -   Font Family selection via dropdown, dynamically loaded from `backend/settings/fonts.yml`.
        -   Font Size selection via dropdown with descriptive terms (e.g., "Small", "Medium").
    -   **Markdown Renderer:** Switched from Showdown.js to `markdown-it` for enhanced Markdown features (e.g., tables).
    -   **Responsive Design:** Implemented `rem` units and media queries for improved responsiveness across all pages, including font size adjustments for mobile.
    -   **Clean URLs:** Implemented clean URLs (e.g., `/dashboard`, `/viewer/:id`, `/editor`) by updating `server.js` and all internal links.
    -   **Development Workflow:** Configured `nodemon` for automatic server restarts and real-time logging.

## Backend Plan (v2):

-   **Architecture:** A Node.js backend with an Express.js API.
-   **Data Storage:** Each blog post is a directory within `backend/posts/`. The directory name is derived from the post title.
-   **Post Structure:** Inside each post directory:
    -   `details.json`: Contains metadata (title, author, email, timestamp/last edited, font-family, font-size, etc.).
    -   `content.md`: Contains the post body in Markdown format.
-   **Soft Deletes:** A `backend/bin/` directory will store deleted posts. The `DELETE` API endpoint will move posts here instead of deleting them permanently.
-   **Frontend Integration:** The frontend will use the `markdown-it` library to render the Markdown content from `content.md` into HTML.