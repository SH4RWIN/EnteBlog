CORS is a browser-enforced security mechanism that restricts a website's JavaScript from making requests to a different "Origin" (protocol + domain + port). It exists to protect users from malicious sites trying to steal data from other servers (including local services).

## 1. What Causes a CORS Error?

A CORS error is **not a server error**. It is a **browser security violation** that occurs when:

1. A client-side script (e.g., on `https://app.com`) attempts to access a resource on a **different origin** (e.g., `https://api.net`).
2. The API server at `https://api.net` responds, but **does not include the necessary CORS permission headers**.

The browser successfully sends the request, but then blocks the client's script from reading the response body.

## 2. How to Fix CORS Errors (Server-Side)

CORS errors are always fixed on the **server that hosts the resource (the API)** by adding specific HTTP **Response Headers**.

| Header to Add | Value / Options | Purpose |
| --- | --- | --- |
| **`Access-Control-Allow-Origin`** | `https://app.com` | **The most common fix.** Explicitly allows a specific origin to access the resource. |
|  | `*` (Wildcard) | **Allows any origin** (use with caution, mostly for public APIs). |
| **`Access-Control-Allow-Methods`** | `GET, POST, PUT, DELETE` | Used in **Preflight Responses** (`OPTIONS` requests) to list which HTTP methods are allowed. |
| **`Access-Control-Allow-Headers`** | `Content-Type, Authorization` | Used in **Preflight Responses** to list which non-standard headers are allowed. |

## 3. The Security Rationale: Why CORS Exists

CORS is the managed exception to the **Same-Origin Policy (SOP)**, the browser's fundamental security rule. SOP and CORS are required to prevent unauthorized access to a user's authenticated data and services.

### A. Preventing Data Leakage

- **Malpractice:** A malicious website (`badsite.com`) loaded in your browser could attempt to send an authenticated request (which automatically includes your session cookies) to your bank's API (`bank.com/account`).
- **Protection:** SOP/CORS blocks the malicious script on `badsite.com` from **reading the response** (your account data), even though the authenticated request was successfully sent.

### B. Preventing Malicious Actions (CSRF)

- **Malpractice:** Hackers can try to perform actions like submitting a form, changing a password, or making a purchase on an authenticated site using a victim's cookies without their knowledge. This is known as **Cross-Site Request Forgery (CSRF)**.
- **CORS Role:** For non-simple requests (`PUT`, `DELETE`, custom `Content-Type`), the browser sends a **Preflight Request (`OPTIONS`)**. If the malicious origin is not explicitly allowed by the API server, the browser blocks the dangerous action request entirely.