Cookies are small pieces of data stored by your browser. You can inspect them using the "Application" tab in Developer Tools.

1. Find the Cookie Panel
Open Developer Tools (Right-click > Inspect) and go to the "Application" tab.

On the left-hand menu, look under "Storage" and click on "Cookies". Select the website you are on.

You will see a table listing all the cookies for that site, with their names, values, and other attributes.

2. Key Cookie Attributes Explained
This table has columns for attributes that control a cookie's security and behavior.

HttpOnly: (A "✓" in this column means it's on)
What it does: Prevents JavaScript on the page from reading this cookie.
Why it's important: This is a crucial security feature to help stop cross-site scripting (XSS) attacks from stealing a user's session cookie.
Secure: (A "✓" in this column means it's on)
What it does: The browser will only send this cookie over a secure (HTTPS) connection.
Why it's important: Prevents the cookie from being stolen in "man-in-the-middle" attacks on public Wi-Fi.
SameSite (Strict / Lax / None):
What it does: Controls whether a cookie is sent with requests initiated from other websites.
Why it's important: This is the primary defense against cross-site request forgery (CSRF) attacks, which trick your browser into sending requests to a site you're logged into (like your bank) from a malicious site.