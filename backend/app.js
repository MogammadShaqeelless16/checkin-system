const express = require('express');
const fs = require("fs");
const csv = require("csvtojson");
const converter = require('json-2-csv');
const cors = require("cors");
const app = express();
app.use(cors());

app.use(express.json());
let jsonDB;

const ensureCSVExists = async (filePath) => {
    if (!fs.existsSync(filePath)) {
        // Create a new CSV file with headers if it doesn't exist
        const headers = ['id', 'email', 'username', 'teamName', 'tShirt', 'checked'];
        const initialData = [headers.join(',')];
        fs.writeFileSync(filePath, initialData.join('\n'), 'utf8');
    }
};

const start = async () => {
    const csvFilePath = "./DB.csv";
    await ensureCSVExists(csvFilePath);
    jsonDB = await csv().fromFile(csvFilePath);
    app.listen(port, () => console.log(`app is listening on port ${port}`));
};

app.get("/api/v1/getData", (req, res) => {
    try {
        const file = fs.readFileSync("./DB.csv", "utf8");
        res.status(200).send(file);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error reading the file");
    }
});

app.post("/api/v1/postData", async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "please provide an ID" });
        }
        let found = false;
        let person;
        for (let i = 0; i < jsonDB.length; i++) {
            if (id === jsonDB[i].id) {
                found = true;
                if (jsonDB[i].checked === "true") {
                    return res.status(300).json({ message: "Person already checked" });
                }
                jsonDB[i].checked = "true";
                person = jsonDB[i];
            }
        }
        if (!found) {
            return res.status(404).json({ message: "Person not found!" });
        }
        converter.json2csv(jsonDB, (err, csv) => {
            if (err) {
                throw err;
            }
            fs.writeFileSync("./DB.csv", csv);
        });
        res.status(200).json({
            email: person.email,
            username: person.username,
            teamName: person.teamName,
            tShirt: person.tShirt,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An error occurred" });
    }
});

const port = 5001;
start();
