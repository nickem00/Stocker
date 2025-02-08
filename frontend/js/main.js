import { io } from "/socket.io/socket.io.esm.min.js";

const socket = io();


document.addEventListener('DOMContentLoaded', () => {
    const stockInput = document.getElementById('input-stock');
    const addStockBtn = document.getElementById('add-stock-btn');
    const feedbackMessage = document.getElementById('feedback-message');
    const usRadio = document.getElementById('us-stocks-radio');
    const swedishRadio = document.getElementById('swedish-stocks-radio');
    const openJsonBtn = document.getElementById('open-json-btn');
    const updateBtn = document.getElementById('update-btn');


    // ===== Functions =====

    function handleStockInput() {
        let symbol = stockInput.value.trim().toUpperCase();

        if (!symbol) {
            showFeedbackMessage('Please enter a stock symbol!', 'red');
            return;
        }

        symbol = symbol.replace(/\s+/g, '-');

        if (swedishRadio.checked) {
            if (!symbol.endsWith('.ST')) {
                symbol += '.ST';
            }
        }

        showFeedbackMessage(`Adding ${symbol}...`, 'black');

        fetch('/api/stocks/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showFeedbackMessage('Something went wrong!', 'red');
            } else {
                showFeedbackMessage(`${symbol} added successfully!`, 'green');
            }
        })
        .catch(() => {
            showFeedbackMessage('Server error. Please try again later.', 'red');
        })

        stockInput.value = '';
    }

    let feedbackTimeout;

    function showFeedbackMessage(message, color) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.color = color;
        feedbackMessage.style.opacity = '1';
        
        if (feedbackTimeout) {
            clearTimeout(feedbackTimeout);
        }

        feedbackTimeout = setTimeout(() => {
            feedbackMessage.style.opacity = '0';
        }, 3000);
    }

    function updateStocks() {
        showFeedbackMessage("Updating stocks...", "black");

        fetch('/api/stocks/update', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showFeedbackMessage('Failed to update stocks.', 'red');
            } else {
                showFeedbackMessage('All stocks updated successfully!', 'green');
            }
        })
        .catch(() => {
            showFeedbackMessage('Server error. Please try again later.', 'red');
        })
    }



    // ===== Event Listeners =====

    addStockBtn.addEventListener('click', handleStockInput);

    stockInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleStockInput();
        }
    });

    openJsonBtn.addEventListener('click', () => {
        console.log('Opening JSON folder...');
        fetch('/api/stocks/open-json')
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(() => console.log('❌ Error opening JSON folder.'));
    });

    updateBtn.addEventListener('click', updateStocks);

    // ======= 🔥 Real-time stock update feedback via Socket.io =======
    socket.on('stockUpdateProgress', (data) => {
        showFeedbackMessage(data.message, 'black');
    })
});


    