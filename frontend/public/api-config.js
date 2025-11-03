// API Configuration
const API_BASE_URL = window.location.origin;

export const api = {
    getPosts: () => fetch(`${API_BASE_URL}/api/posts`),
    getPost: (id) => fetch(`${API_BASE_URL}/api/posts/${id}`),
    createPost: (data) => fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updatePost: (id, data) => fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deletePost: (id) => fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: 'DELETE'
    }),
    subscribe: (email) => fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }),
    getFlashMessages: () => fetch(`${API_BASE_URL}/api/flash-messages`)
};