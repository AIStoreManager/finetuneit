const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let prompts = [];

const filePath = path.join(__dirname, 'fine-tuning-dataset.jsonl');
console.log(filePath);

// Read the file once when the server starts
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }
    if (!data.trim()) {
        console.warn('File is empty');
        prompts = [];
        return;
    }
    const lines = data.trim().split('\n');
    prompts = lines.map((line) => JSON.parse(line));
});
  

// This is the new GET route to get the prompts
app.get('/', (req, res) => {
  res.json(prompts);
});

app.post('/generate-jsonl', (req, res) => {
    console.log("Received prompts:", req.body.prompts);
    const outputData = req.body.prompts.map((prompt) => JSON.stringify(prompt)).join('\n');
    
    fs.writeFile(filePath, outputData, (err) => {
      if (err) {
        console.error('Error writing the file:', err);
        res.status(500).send('Error writing the file');
        return;
      }
      
      // Update the in-memory data after successfully writing to the file
      prompts = req.body.prompts;
      res.status(200).send('File saved successfully');
    });
  });
  

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
