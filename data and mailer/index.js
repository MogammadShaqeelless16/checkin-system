const { readCSV } = require("./generate");
const fs = require("fs");
const path = require("path");
const { send_emails_accepted } = require("./mailer");

// Ensure the CSV file exists
const csvFilePath = 'data/_test.csv';
const templateFilePath = './template.html';

const ensureFileExists = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.log(`File ${filePath} does not exist. Creating it with dummy data.`);
        createDummyCSV(filePath);
    } else {
        console.log(`File ${filePath} already exists.`);
    }
}

const createDummyCSV = (filePath) => {
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

// Ensure the CSV file exists
ensureFileExists(csvFilePath);

// Read the email template
const mail_template = fs.readFileSync(templateFilePath, 'utf8');

// Main function
async function Main() {
    const mail_subject = "Keep Innovating! Your Application for the Bejaia Hackathon";
    
    const rows = await readCSV(csvFilePath);
    
    if (rows.length === 0) {
        console.log("No rows found in the CSV file.");
        return;
    }
    
    await send_emails_accepted(rows, mail_subject, mail_template, []);
}

// Execute Main function
Main();
