/**
 * Get a cookie by name
 * @param {string} name - The name of the cookie to get
 * @returns {string|null} The cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null; // For server-side rendering
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

/**
 * Set a cookie
 * @param {string} name - The name of the cookie
 * @param {string} value - The value to store in the cookie
 * @param {number} days - Number of days until the cookie expires
 */
export const setCookie = (name, value, days = 7) => {
  if (typeof document === 'undefined') return; // For server-side rendering
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
};

/**
 * Remove a cookie
 * @param {string} name - The name of the cookie to remove
 */
export const removeCookie = (name) => {
  if (typeof document === 'undefined') return; // For server-side rendering
  
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  return !!getCookie('userJwtToken');
};

/**
 * Check if the user is an admin
 * @returns {boolean} True if user has a valid admin token
 */
export const isAdmin = () => {
  return !!getCookie('adminJwtToken');
};
