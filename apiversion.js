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
    res.send({ result: data.Buckets });
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
    res.send(data);
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
    res.send(data);
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
    res.status(200).send({ "result": `${key} was successfully deleted from bucket ${name}` });
  });
});

app.get('/bucket/:name/:key/link', (req, res) => {
  const { name, key } = req.params;
  const url = s3.getSignedUrl('getObject', {
    Bucket: name,
    Key: key,
    Expires: 60 // URL expires in 60 seconds
  });
  res.send({ url });
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

//to upload multiple files
// app.post('/upload', upload.array('files'), (req, res) => {
// res.send(`File(s) uploaded to bucket ${req.body.bucket}`);
// });

app.post('/upload', upload.single('file'), (req, res) => {
  res.send(`File uploaded to bucket ${req.body.bucket}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
