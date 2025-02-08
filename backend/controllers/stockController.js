/**
 * @file stockController.js
 * @description This file contains the controller functions for handling stock data.
 * It reads stock data from a JSON file and sends it as a response to the client.
 * 
 * @module controllers/stockController
 */

import { error } from 'console';
import { io } from '../app.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';
import { exec } from 'child_process';

// __filename is a variable that contains the full path and filename of the current module file.
// It is useful for getting the current file's path.
const __filename = fileURLToPath(import.meta.url);

// __dirname is a variable that contains the directory name of the current module file.
// It is useful for getting the current directory's path.
const __dirname = path.dirname(__filename);

// Path to the JSON file containing stock data.
const dataFilePath = path.join(__dirname, '../data/stocks.json');

const dataFolderPath = path.join(__dirname, '../data');

/**
 * @function getAllStocks
 * @description This function handles the HTTP GET request to retrieve all stock data.
 * It reads the stock data from a JSON file and sends it as a JSON response.
 * If the file does not exist, it sends a 404 error response.
 * If there is an error during the process, it sends a 500 error response.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * 
 * @returns {void}
 * 
 * @example
 * // Example usage in an Express route
 * app.get('/api/stocks', getAllStocks);
 */
export const getAllStocks = (req, res) => {
    try {
        if (!fs.existsSync(dataFilePath)) {
            return res.status(404).json({ error: 'Stock data not found' });
        }

        const rawData = fs.readFileSync(dataFilePath);
        const stocks = JSON.parse(rawData);

        res.json(stocks);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong when getting stocks' });     
    }
}

yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical'])




/**
 * @function addStock
 * @description This function handles the HTTP POST request to add a new stock or update an existing one.
 * It fetches stock data from Yahoo Finance, processes it, and saves it to a JSON file.
 * If the stock symbol is not provided, it sends a 400 error response.
 * If there is an error during the process, it sends a 500 error response.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage in an Express route
 * app.post('/api/stocks', addStock);
 */
export const addStock = async (req, res) => {
    // console.log("🔍 Request Headers:", req.headers);
    // console.log("🔍 Request body:", req.body);
    
    try {
        const { symbol } = req.body;
        if (!symbol) {
            return res.status(400).json({ error: 'Ingen aktiesymbol angiven' });
        }
        console.log(`🔍 Hämtar data för: ${symbol}`);

        // Begär de moduler vi behöver för att få med så mycket data som möjligt
        const modules = [
            'assetProfile',
            'price',
            'summaryDetail',
            'defaultKeyStatistics',
            'financialData',
            'recommendationTrend'
        ];
        const stockInfo = await yahooFinance.quoteSummary(symbol, { modules });
        // console.log("📜 Stock metadata:", JSON.stringify(stockInfo, null, 2));

        // Hämta historisk data för de senaste 3 åren med daglig upplösning (så vi får med adjClose)
        const today = new Date();
        const threeYearsAgo = new Date(today);
        threeYearsAgo.setFullYear(today.getFullYear() - 3);
        console.log(`📅 Hämtar historisk data från ${threeYearsAgo.toISOString().split('T')[0]} till ${today.toISOString().split('T')[0]}`);

        const historicalData = await yahooFinance.historical(symbol, {
            period1: threeYearsAgo.toISOString().split('T')[0],
            period2: today.toISOString().split('T')[0],
            interval: '1d'
        });
        // console.log("📊 Full historisk data:", JSON.stringify(historicalData, null, 2));

        if (!historicalData || historicalData.length === 0) {
            console.error("❌ Ingen historisk data hittad.");
            return res.status(500).json({ error: "Historisk data inte tillgänglig. Försök igen senare." });
        }

        // Hjälpfunktion: returnerar justerat pris om det finns, annars close-värdet
        const getPrice = (quote) => {
            return (quote.adjClose !== undefined && quote.adjClose !== null)
                ? quote.adjClose
                : quote.close;
        };

        // Det senaste tillgängliga priset från historiken
        const latestQuote = historicalData[historicalData.length - 1];
        const latestPrice = getPrice(latestQuote);
        const latestDate = new Date(latestQuote.date);

        // Funktion för att hitta det datum i historisk data som ligger närmast ett givet måldatum
        const findClosestDate = (targetDate) => {
            return historicalData.reduce((closest, current) => {
                const currentDate = new Date(current.date);
                const diffCurrent = Math.abs(currentDate - targetDate);
                const diffClosest = Math.abs(new Date(closest.date) - targetDate);
                return diffCurrent < diffClosest ? current : closest;
            });
        };

        // Definiera måldatum för utvecklingsperioder
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const threeYearsAgoExact = new Date(today);
        threeYearsAgoExact.setFullYear(threeYearsAgoExact.getFullYear() - 3);

        // Hitta närmaste datapunkt för varje period
        const closest1Month = findClosestDate(oneMonthAgo);
        const closest3Months = findClosestDate(threeMonthsAgo);
        const closest1Year = findClosestDate(oneYearAgo);
        const closest3Years = findClosestDate(threeYearsAgoExact);

        // Funktion för att beräkna procentuell förändring
        const calculateReturn = (oldPrice) => {
            if (!oldPrice || oldPrice === 0) return "Data saknas";
            return `${(((latestPrice - oldPrice) / oldPrice) * 100).toFixed(2)}%`;
        };

        // Funktion för att generera en etikett med eventuell dagavvikelse
        const getLabel = (targetDate, actualDate, periodLabel) => {
            const diffDays = Math.round((actualDate - targetDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return periodLabel;
            else if (diffDays > 0) return `${periodLabel} + ${diffDays} days`;
            else return `${periodLabel} - ${Math.abs(diffDays)} days`;
        };

        const label1Month = getLabel(oneMonthAgo, new Date(closest1Month.date), "1 Month");
        const label3Months = getLabel(threeMonthsAgo, new Date(closest3Months.date), "3 Months");
        const label1Year = getLabel(oneYearAgo, new Date(closest1Year.date), "1 Year");
        const label3Years = getLabel(threeYearsAgoExact, new Date(closest3Years.date), "3 Years");

        // För de finansiella nyckeltalen:
        // EPS hämtas från defaultKeyStatistics (trailingEps)
        const trailingEps = stockInfo.defaultKeyStatistics?.trailingEps;
        // Om trailingEps finns och är > 0, beräkna trailing P/E manuellt
        let computedTrailingPE = "Unknown";
        if (trailingEps && trailingEps !== 0) {
            computedTrailingPE = parseFloat((latestPrice / trailingEps).toFixed(2));
        }

        // Formatera recommendationTrend om den finns
        const formatRecommendationTrend = (trendArray) => {
            if (!trendArray || trendArray.length === 0) return "Unknown";
            const trend = trendArray[0];
            return `(${trend.period}) ${trend.strongBuy} strong buy, ${trend.buy} buy, ${trend.hold} hold, ${trend.sell} sell, ${trend.strongSell} strong sell`;
        };
        const recommendation = stockInfo.recommendationTrend
            ? formatRecommendationTrend(stockInfo.recommendationTrend.trend)
            : (stockInfo.defaultKeyStatistics?.recommendationMean || stockInfo.price?.recommendationKey || "Unknown");

        // Bygg JSON-objektet med de extra finansiella nyckeltalen
        const stockData = {
            Symbol: symbol,
            Name: stockInfo.price.longName || stockInfo.price.shortName || "Unknown",
            ShortName: stockInfo.price.shortName || "Unknown",
            Website: stockInfo.assetProfile.website || "Unknown",
            Sector: stockInfo.assetProfile.sector || "Unknown",
            Industry: stockInfo.assetProfile.industry || "Unknown",
            Country: stockInfo.assetProfile.country || "Unknown",
            Address: {
                Street: stockInfo.assetProfile.address1 || "Unknown",
                City: stockInfo.assetProfile.city || "Unknown",
                State: stockInfo.assetProfile.state || "Unknown",
                Zip: stockInfo.assetProfile.zip || "Unknown"
            },
            MarketCapitalization: stockInfo.price.marketCap || "Unknown",

            // Finansiella nyckeltal
            TrailingPE: computedTrailingPE,
            ForwardPE: stockInfo.defaultKeyStatistics?.forwardPE || stockInfo.financialData?.forwardPE || "Unknown",
            EPS: trailingEps || "Unknown",
            epsTrailingTwelveMonths: stockInfo.price?.epsTrailingTwelveMonths || trailingEps || "Unknown",
            epsForward: stockInfo.price?.epsForward || "Unknown",
            Beta: stockInfo.defaultKeyStatistics?.beta || stockInfo.financialData?.beta || "Unknown",
            BookValue: stockInfo.defaultKeyStatistics?.bookValue || stockInfo.price?.bookValue || "Unknown",
            PriceToBook: stockInfo.defaultKeyStatistics?.priceToBook || stockInfo.price?.priceToBook || "Unknown",
            TotalRevenue: stockInfo.financialData?.totalRevenue || "Unknown",
            GrossMargins: stockInfo.financialData?.grossMargins || stockInfo.summaryDetail?.grossMargins || "Unknown",
            OperatingMargins: stockInfo.financialData?.operatingMargins || stockInfo.summaryDetail?.operatingMargins || "Unknown",
            Recommendation: recommendation,
            AnalystTargetMeanPrice: stockInfo.financialData?.targetMeanPrice || stockInfo.price?.targetMeanPrice || "Unknown",

            Dividend: {
                DividendRate: stockInfo.financialData?.dividendRate || stockInfo.summaryDetail?.dividendRate || "Unknown",
                DividendYield: stockInfo.financialData?.dividendYield || stockInfo.summaryDetail?.dividendYield || "Unknown",
                ExDividendDate: stockInfo.financialData?.exDividendDate || stockInfo.summaryDetail?.exDividendDate || "Unknown"
            },

            "52WeekHigh": stockInfo.financialData?.targetHighPrice || stockInfo.summaryDetail?.fiftyTwoWeekHigh || "Unknown",
            "52WeekLow": stockInfo.financialData?.targetLowPrice || stockInfo.summaryDetail?.fiftyTwoWeekLow || "Unknown",

            RealtimePrice: {
                timestamp: latestDate.toISOString(),
                price: latestPrice
            },
            Development: {
                [label1Month]: calculateReturn(getPrice(closest1Month)),
                [label3Months]: calculateReturn(getPrice(closest3Months)),
                [label1Year]: calculateReturn(getPrice(closest1Year)),
                [label3Years]: calculateReturn(getPrice(closest3Years))
            },
            HistoricalData: {
                [label1Month]: {
                    date: closest1Month.date,
                    close: getPrice(closest1Month)
                },
                [label3Months]: {
                    date: closest3Months.date,
                    close: getPrice(closest3Months)
                },
                [label1Year]: {
                    date: closest1Year.date,
                    close: getPrice(closest1Year)
                },
                [label3Years]: {
                    date: closest3Years.date,
                    close: getPrice(closest3Years)
                }
            }
        };

        // Läs in befintlig data från JSON-filen om den finns, annars skapa en tom array
        let stocks = [];
        if (fs.existsSync(dataFilePath)) {
            try {
                const fileData = fs.readFileSync(dataFilePath, 'utf-8');
                stocks = JSON.parse(fileData);
                if (!Array.isArray(stocks)) {
                    stocks = [];
                }
            } catch (err) {
                console.error("❌ Kunde inte läsa/parsa JSON-filen. Startar med en tom array.", err);
                stocks = [];
            }
        }

        // Kolla om aktien redan finns och uppdatera i så fall, annars lägg till ny aktie
        const index = stocks.findIndex(item => item.Symbol.toUpperCase() === symbol.toUpperCase());
        if (index !== -1) {
            stocks[index] = stockData; // Uppdatera befintlig aktie
        } else {
            stocks.push(stockData); // Lägg till ny aktie
        }

        // Spara data till JSON-filen genom att skriva över med den uppdaterade arrayen
        fs.writeFileSync(dataFilePath, JSON.stringify(stocks, null, 4));
        return res.json({ message: "Stock added/updated", stock: stockData });

    } catch (error) {
        console.error("❌ Error in addStock():", error);
        res.status(500).json({ error: "Failed to fetch stock data." });
    }
};






/**
 * @function openJsonFolder
 * @description This function handles the HTTP GET request to open the folder containing the JSON file with stock data.
 * It determines the operating system and executes the appropriate command to open the folder.
 * If there is an error during the process, it sends a response indicating the error.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * 
 * @returns {void}
 * 
 * @example
 * // Example usage in an Express route
 * app.get('/api/open-json-folder', openJsonFolder);
 */
export const openJsonFolder = (req, res) => {
    console.log("📂 Open JSON request recieved..");

    const platform = process.platform;

    let command;
    if (platform === 'win32') {
        command = `start ${dataFolderPath}`; // Windows
    } else if (platform === 'darwin') {
        command = `open ${dataFolderPath}`; // macOS
    } else {
        command = `xdg-open ${dataFolderPath}`; // Linux
    }

    exec(command, (error) => {
        if (error) {
            console.warn("⚠️ Warning: Folder may have opened but error was detected:", error.message);
            return res.json({ message: "Folder opened, but command returned an error.", error: error.message });
        }
        console.log("📂 Folder opened successfully.");
        return res.json({ message: "Folder opened successfully" });
    })
}





export const updateStocks = async (req, res) => {
    console.log("🔄 Updating all stocks...");

    try {
        if (!fs.existsSync(dataFilePath)) {
            return res.status(404).json({ error: 'Stock data file not found' });
        }

        const fileData = fs.readFileSync(dataFilePath, 'utf-8');
        let stocks = JSON.parse(fileData);

        if (!Array.isArray(stocks) || stocks.length === 0) {
            return res.status(404).json({ error: 'No stock data found' });
        }

        let updatedCount = 0;
        const totalStocks = stocks.length;

        for (let stock of stocks) {
            console.log(`🔄 Updating stock: ${stock.Symbol}`);

            await addStock({ body: { symbol: stock.Symbol } }, { json: () => {} });

            updatedCount++;
            io.emit('stockUpdateProgress', { message: `${updatedCount} of ${totalStocks} stocks updated...` });
        }

        console.log("✅ All stocks updated successfully.");
        res.json({ message: "All stocks updated successfully" });
    } catch (error) {
        console.error("❌ Error in updateStocks():", error);
        res.status(500).json({ error: "Failed to update stock data" });
    }
}