const { S3 } = require("aws-sdk");
const dotenv = require("dotenv").config();
const https = require("https");
const multer = require("multer");
const multerS3 = require("multer-s3");
const express = require("express");

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    sslEnabled: process.env.AWS_SSL_ENABLE,
    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE,

    httpOptions: {
        agent: new https.Agent({ rejectUnauthorized: false }),
    },
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_S3_URL,
});


const app = express();


app.get('/', (req, res) => {
    s3.listBuckets((err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error listing buckets');
            return;
        }
        res.send(`
        <h1>Buckets:</h1>
        <ul>
          ${data.Buckets.map(b => `<li>${b.Name}</li>`).join('')}
        </ul>
      `);
    });
});

app.get('/bucket/:name', (req, res) => {
    const { name } = req.params;
    s3.listObjects({ Bucket: name }, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send(`Error listing objects in bucket ${name}`);
            return;
        }
        res.send(`
        <h1>Objects in bucket ${name}:</h1>
        <ul>
          ${data.Contents.map(o => `<li>${o.Key}</li>`).join('')}
        </ul>
      `);
    });
});


app.get('/bucket/:name/:key', (req, res) => {
    const { name, key } = req.params;
    s3.getObject({ Bucket: name, Key: key }, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send(`Error getting object ${key} from bucket ${name}`);
            return;
        }
        res.send(`
        <h1>Object: ${key}</h1>
        <h2>Preview:</h2>
        <img src="data:${data.ContentType};base64,${data.Body.toString('base64')}" alt="Object preview" />
        <h2>Properties:</h2>
        <ul>
          ${Object.keys(data.Metadata).map(k => `<li><b>${k}:</b> ${data.Metadata[k]}</li>`).join('')}
        </ul>
      `);
    });
});


app.delete('/bucket/:name/:key', (req, res) => {
    const { name, key } = req.params;
    s3.deleteObject({ Bucket: name, Key: key }, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send(`Error deleting object ${key} from bucket ${name}`);
            return;
        }
        res.send(`Object ${key} was deleted from bucket ${name}`);
    });
});

app.get('/bucket/:name/:key/link', (req, res) => {
    const { name, key } = req.params;
    const url = s3.getSignedUrl('getObject', {
        Bucket: name,
        Key: key,
        Expires: 60 // URL expires in 60 seconds
    });
    res.send(`
      <h1>Object: ${key}</h1>
      <h2>Download link:</h2>
      <a href="${url}">${url}</a>
    `);
});


app.listen(8080, () => {
    console.log("Server listening on port 8080.");
});
