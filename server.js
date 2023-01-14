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

const PORT = process.env.PORT || 8080
const app = express();


app.get('/', (req, res) => {
  s3.listBuckets((err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error listing buckets');
      return;
    }
    res.send(`
        <h1>
        List of Avaialbe Buckets :
        <a href="/upload"> Click here To Upload</a>
        </h1>
        <ul>
          ${data.Buckets.map(b => `<li><a href="/bucket/${b.Name}">${b.Name}</a></li>`).join('')}
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
          ${data.Contents.map(o => `<li><a href="/bucket/${name}/${encodeURIComponent(o.Key)}">${o.Key}</a></li>`).join('')}
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
    if (key.endsWith(".txt") || key.endsWith(".dart") || key.endsWith(".js")) {
      const fileContent = data.Body.toString("utf-8");
      res.send(`
        <h1>Object: ${key}</h1>        
        <ul>
        <li><a href="/bucket/${name}/${encodeURIComponent(key)}/link"> Genrate sharable link</a></li>
        <li><a href="/delete/${name}/${encodeURIComponent(key)}"> Click here to delete</a></li>
        </ul>
        <h2>Preview:</h2>        
        <pre>${fileContent}</pre>
        <h2>Properties:</h2>
        <ul>
          ${Object.keys(data.Metadata).map(k => `<li><b>${k}:</b> ${data.Metadata[k]}</li>`).join('')}
        </ul>
      `);
    } else {
      const fileContent = Buffer.from(data.Body).toString("base64");
      res.send(`
        <h1>Object: ${key}</h1>        
        <ul>
        <li><a href="/bucket/${name}/${encodeURIComponent(key)}/link"> Genrate sharable link</a></li>
        <li><a href="/delete/${name}/${encodeURIComponent(key)}"> Click here to delete</a></li>
        </ul>
        <h2>Preview:</h2>
        <img src="data:${data.ContentType};base64,${fileContent}" alt="Object preview" />
        <h2>Properties:</h2>
        <ul>
          ${Object.keys(data.Metadata).map(k => `<li><b>${k}:</b> ${data.Metadata[k]}</li>`).join('')}
        </ul>
      `);
    }
  });

});


app.get('/delete/:name/:key', (req, res) => {
  const { name, key } = req.params;
  s3.deleteObject({ Bucket: name, Key: key }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(`Error deleting object ${key} from bucket ${name}`);
      return;
    }
    res.redirect(`/bucket/${name}`);
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



const upload = multer({
  storage: multerS3({
    s3: s3, // The S3 client object that you created earlier
    bucket: (req, file, cb) => {
      // Allow the user to select the bucket by passing it as a query parameter
      cb(null, req.body.bucket);
    },
    key: (req, file, cb) => {
      // Use the original file name as the key (i.e., the file name in S3)
      cb(null, file.originalname);
    }
  })
});

app.get('/upload', (req, res) => {
  s3.listBuckets((err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error listing buckets');
      return;
    }
    res.send(`
      <h1>Upload a file</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <div>
          <label for="bucket">Bucket:</label>
          <select name="bucket" id="bucket">
            ${data.Buckets.map(b => `<option value="${b.Name}">${b.Name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label for="file">File:</label>
          <input type="file" name="file" id="file" />
        </div>
        <input type="submit" value="Upload" />
      </form>
    `);
  });
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.send(`File uploaded to bucket ${req.body.bucket}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
