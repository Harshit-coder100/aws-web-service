const express = require('express');
const fs = require('fs');
const { promisify } = require('util');

// Promisifying all required fileSystem methods.
const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);

const dotenv = require("dotenv")
dotenv.config();
console.log(process.env.PORT)

const app = express();
const port = 3000;
const dataDirectory = './data_storage';

// Binding a json-parser middleware to parse the json in incoming requests.
app.use(express.json());

// Create the data directory if it doesn't exist
async function initDataDirectory() {
  try {
    await mkdirAsync(dataDirectory);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating data directory:', error);
    }
  }
}

// Initializing the data directory
initDataDirectory();

// @params key  (key is the object-identifier)
// @desc Creating the objects. If the request for creating the same
//  object is hit multiple times, It will not create the same
//  object again-again, instead it will update the same object/file.
app.put('/objects/:key', async (req, res) => {
  const key = req.params.key;
  const filePath = `${dataDirectory}/${key}`;

  try {
    await writeFileAsync(filePath, req.body.data);
    res.status(201).json({ message: 'Object created' });
  } catch (error) {
    console.error('Error uploading object:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @param key
// @desc Getting the contents of a specific object specified by key-param.
app.get('/objects/:key', (req, res) => {
  const key = req.params.key;
  const filePath = `${dataDirectory}/${key}`;

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).json({ message: 'Object not found' });
    } else {
      fs.readFile(filePath, (error, data) => {
        if (error) {
          console.error('Error reading object:', error);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          res.status(200).send(data);
        }
      });
    }
  });
});

// @param key
// @desc Deleting a specific-object from the data_storage.
app.delete('/objects/:key', async (req, res) => {
  const key = req.params.key;
  const filePath = `${dataDirectory}/${key}`;

  try {
    await unlinkAsync(filePath);
    res.status(204).json({ message: 'Object deleted' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @param key
// @desc Getting the list of all objects stored within the data_storage.
app.get('/objects', async (req, res) => {
  try {
    const files = await readdirAsync(dataDirectory);
    res.status(200).json(files);
  } catch (error) {
    console.error('Error listing objects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`S3-like service listening at http://localhost:${port}`);
});