/**
 * @fileoverview This file sets up the main Express application for the Stocker backend.
 * It includes middleware for JSON parsing, Cross-Origin Resource Sharing (CORS), and HTTP request logging.
 * The stockRouter is imported to handle routes related to stock operations.
 * 
 * @requires express - The Express framework for building web applications.
 * @requires cors - Middleware to enable Cross-Origin Resource Sharing.
 * @requires morgan - HTTP request logger middleware for Node.js.
 * @requires path - Node.js module for handling and transforming file paths.
 * @requires url - Node.js module for URL resolution and parsing.
 * @requires ./routes/stockRoutes.js - The router module for handling stock-related routes.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { stockRouter } from './routes/stockRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * The __filename constant holds the absolute path of the current module file.
 * 
 * This is achieved by using the `fileURLToPath` function from the 'url' module,
 * which converts the file URL of the current module (import.meta.url) to a path string.
 * 
 * This is particularly useful for getting the file path in ES modules, where __filename 
 * is not available by default as it is in CommonJS modules.
 * 
 * Example usage:
 * console.log(__filename); // Outputs the absolute path of the current file
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * Middleware to parse incoming JSON requests.
 * This allows the server to handle JSON payloads in HTTP requests.
 */
app.use(express.json());

/**
 * Middleware to enable Cross-Origin Resource Sharing (CORS).
 * This allows the server to accept requests from different origins.
 * Allows frontend to make requests to the backend server.
 */
app.use(cors());

/**
 * Middleware to log HTTP requests and errors.
 * 'dev' format provides concise output colored by response status for development use.
 */
app.use(morgan('dev'));

/**
 * Serves static files from the specified directory.
 * This middleware serves the frontend files located in the '../frontend' directory.
 * 
 * @param {string} path - The path to the directory containing the static files.
 */
app.use(express.static(path.join(__dirname, '../frontend')));

/**
 * Route to serve the main HTML file.
 * This route handles GET requests to the root URL ('/') and responds with the 'index.html' file.
 * 
 * @param {string} path - The path to the 'index.html' file.
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


/**
 * Mounts the stockRouter at the '/api/stocks' path.
 * This router will handle all routes related to stock operations.
 * 
 * @param {string} path - The base path for the stockRouter.
 * @param {Router} stockRouter - The router handling stock-related routes.
 */
app.use('/api/stocks', stockRouter);

// The port number on which the server will listen for incoming requests.
const PORT = process.env.PORT || 3000;

/**
 * Starts the server and listens on the specified port.
 * Logs a message to the console once the server is running.
 * 
 * @param {number} PORT - The port number on which the server will listen for incoming requests.
 */
app.listen(PORT, () => {
    console.log(`✅ Servern körs på http://localhost:${PORT}`);
});