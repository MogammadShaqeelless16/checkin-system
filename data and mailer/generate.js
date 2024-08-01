const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const qrcode = require("qrcode");
const uuid = require("uuid").v4;
const Jimp = require('jimp');
const jsQR = require('jsqr');

// Function to generate dummy data
const generateDummyData = (filePath) => {
    const headers = ['email', 'username', 'teamName', 'tShirt', 'checked'];
    const dummyData = [
        ['john.doe@example.com', 'john_doe', 'Team Alpha', 'M', 'false'],
        ['jane.smith@example.com', 'jane_smith', 'Team Beta', 'L', 'false'],
        ['mike.jones@example.com', 'mike_jones', 'Team Gamma', 'S', 'false'],
        ['lisa.white@example.com', 'lisa_white', 'Team Delta', 'XL', 'false']
    ];

    let csvContent = headers.join(",") + "\n";
    dummyData.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    fs.writeFileSync(filePath, csvContent);
    console.log(`Dummy data written to ${filePath}`);
}

// Function to ensure CSV file exists and create dummy data if not
const ensureCSVExists = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        generateDummyData(filePath);
    }
}

// Function to ensure images folder exists
const ensureImagesFolderExists = (imagesFolder) => {
    if (!fs.existsSync(imagesFolder)) {
        fs.mkdirSync(imagesFolder, { recursive: true });
    }
}

// Function to read CSV file
async function readCSV(filePath) {
    const rows = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", () => {
                console.log(`Read ${rows.length} rows from ${filePath}`);
                if (rows.length === 0) {
                    console.log(`No rows found in ${filePath}.`);
                }
                resolve(rows);
            })
            .on("error", (error) => {
                console.error(`Error reading ${filePath}:`, error);
                reject(error);
            });
    });
}

// Function to generate IDs for rows
async function generateIDs(rows) {
    return rows.map((row) => ({ ...row, id: uuid() }));
}

// Function to generate QR codes
const generateQRCodes = async (rows, imagesFolder) => {
    for (const row of rows) {
        const filePath = path.join(imagesFolder, `${row.email}.png`);
        try {
            await qrcode.toFile(filePath, row.id);
            console.log(`QR code generated for ${row.email} at ${filePath}`);
        } catch (error) {
            console.error(`Error generating QR code for ${row.email}:`, error);
        }
    }
}

// Function to write rows to a CSV file
async function writeCSV(filePath, rows) {
    if (rows.length === 0) {
        throw new Error("No data to write to CSV.");
    }
    let csvContent = Object.keys(rows[0]).join(",") + "\n";
    rows.forEach((row) => {
        csvContent += Object.values(row).join(",") + "\n";
    });
    fs.writeFileSync(filePath, csvContent);
    console.log(`CSV written to ${filePath}`);
}

// Function to append a row to a CSV file
async function AppendRowInCSV(filePath, row) {
    const csvContent = Object.values(row).join(",") + "\n";
    fs.appendFileSync(filePath, csvContent);
    console.log(`Row appended to ${filePath}`);
}

// Function to decode QR codes
const decodeQR = async (image_path) => {
    try {
        const image = await Jimp.read(image_path);
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height,
        };
        const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

        if (!decodedQR) {
            throw new Error('QR code not found in the image.');
        }

        return decodedQR.data;
    } catch (error) {
        console.error('Error decoding QR code:', error);
    }
}

// Main function to initialize the process
const initChecking = async (inputFile, outputFile, imagesFolder) => {
    ensureCSVExists(inputFile);
    ensureImagesFolderExists(imagesFolder);

    const rows = await readCSV(inputFile);
    if (rows.length === 0) {
        console.log("No rows to process.");
        return;
    }

    const rowsWithIDs = await generateIDs(rows);
    await generateQRCodes(rowsWithIDs, imagesFolder);
    await writeCSV(outputFile, rowsWithIDs);
};

// Function to test QR code decoding and updating CSV
const Test = async () => {
    const inputFile = "data/_accept.csv";
    const imagesFolder = "new-images";

    ensureCSVExists(inputFile);
    ensureImagesFolderExists(imagesFolder);

    const rows = await readCSV(inputFile);
    if (rows.length === 0) {
        console.log("No rows found in the input CSV.");
        return;
    }

    for (let row of rows) {
        const filePath = path.join(imagesFolder, `${row.email}.png`);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const id = await decodeQR(filePath);
        row.id = id || 'QR code decode failed';
        row.checked = "false";
    }

    await writeCSV("data/DATA.csv", rows);
}

Test().catch(console.error);

module.exports = {
    readCSV,
    generateIDs,
    generateQRCodes,
    writeCSV,
    AppendRowInCSV
};
