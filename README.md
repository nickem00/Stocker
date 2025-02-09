# Stocker 📈

**Stocker** is a simple web application that lets you manage and monitor stocks in real time. It allows you to add stock symbols, update stock data with real-time feedback using Socket.io, and open the JSON folder containing the stored data. The backend is built with **Node.js**, **Express**, **Socket.io**, and **yahoo-finance2** for fetching financial information.

Currently, Stocker is designed to run locally and focuses on gathering detailed stock data in a structured JSON format. This approach makes it easier for AI systems or LLMs to process, analyze, and understand the data.


---

## Features 🚀

- **Add Stocks:** Enter a stock symbol to add or update stock data.
- **Update Stocks:** Trigger an update for all stored stocks with real-time feedback.
- **Real-time Feedback:** Get update status via Socket.io.
- **Open JSON Folder:** Open the folder with JSON data directly from the browser.

---

## Installation and Setup 🛠️

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/stocker.git
   cd stocker
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Start the Application:**

   ```bash
   npm run dev
   ```

4. **Open in Browser:**

   Visit [http://localhost:3000](http://localhost:3000) to start using the application.

---

## Technologies Used 🛠️

- **Node.js:** JavaScript runtime for server-side code.
- **Express:** Web framework for Node.js.
- **Socket.io:** Real-time bidirectional event-based communication.
- **yahoo-finance2:** Yahoo Finance API for fetching stock data.

---

## Project Structure 📁

```plaintext
Stocker/
├── backend/                # Backend code
│   ├── controllers/        # Controller functions for handling stock data
│   │   └── stockController.js
│   ├── data/               # JSON file storing stock data
│   │   └── stocks.json
│   ├── middleware/         # Middleware (e.g., errorHandler)
│   │   └── errorHandler.js
│   ├── models/             # Data models (e.g., stockModel.js)
│   │   └── stockModel.js
│   ├── routes/             # Route definitions
│   │   └── stockRoutes.js
│   └── app.js              # Main Express application file
├── frontend/               # Frontend code
│   ├── css/                # CSS styles
│   │   └── styles.css
│   ├── js/                 # JavaScript files
│   │   └── main.js
│   └── index.html          # Main HTML file
├── node_modules/           # Installed npm packages
├── package-lock.json       # Package lock file
└── package.json            # Project configuration and dependencies
```

---

## Future Improvements and Enhancements ✨

- **User Authentication:** Add login functionality and user profiles.
- **Improved UI/UX:** Develop a more responsive and modern interface.
- **Detailed Stock Analysis:** Incorporate graphs and additional financial metrics.
- **Admin Panel:** Create an admin interface for managing stock data.
- **Automated Testing:** Introduce unit and integration tests to enhance reliability.

---

## License 📄

This project is licensed under the [MIT License](LICENSE).

---

_Made with ❤️ by Nicholas Malm_