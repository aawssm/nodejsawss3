# Node Express AWS-SDK Multer EJS


This is a simple Node.js Express application that demonstrates how to use the AWS-SDK to interact with an Amazon S3 bucket. The application allows you to list the contents of a bucket, view file properties and content, and upload and delete files from the bucket.

Here is a list of some of the major cloud storage providers that are compatible with Amazon S3:

1. AWS S3
2. Google Cloud Storage
3. Lindo Cloud
4. Oracle Cloud Storage
5. Microsoft Azure Blob Storage
6. IBM Cloud Object Storage
7. DigitalOcean Spaces
8. Wasabi Hot Cloud Storage
9. Cloudian HyperStore
10. Backblaze B2 Cloud Storage
11. MINIO

## Prerequisites

1. Node.js
2. Express
3. AWS-SDK
4. Multer
5. Multer S3
6. EJS

## Installation

1. Clone the repository:

```
git clone https://github.com/user/repo.git
```

2. Install the dependencies:

```
npm install
```

3. Set up your AWS credentials and bucket details in the .env file:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your_bucket_name
```

Start the application:

```
npm start
```

5. Open your browser and navigate to http://localhost:8080.
```
npm run start
//to run code genrated from chat gpt

npm run demo
//to run demo

npm run api
//to get json response
```

## Features

1. [x] List all the buckets in the object storage
2. [x] List all the files and folders in the object storage
3. [x] View file properties and content
4. [x] Upload files to bucket
5. [x] Delete files from the bucket
6. [x] Get Secure Sharable link

## Docs

0. set env vrables

```env
AWS_S3_UPLOAD_MAX_SIZE = 26214400
AWS_S3_FORCE_PATH_STYLE = true
AWS_S3_ACL = private
AWS_SSL_ENABLE = false


AWS_REGION = us-east-1
AWS_S3_URL = https://axxxbxxxcxxxxdxxxxe.com
AWS_ACCESS_KEY_ID  = axxxbxxxcxxxxdxxxxe
AWS_SECRET_ACCESS_KEY = "axxxbxxxcxxxxdxxxxe"

```

1. initliase the s3 object

```js
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
```

2. To List all the buckets in the aws s3 compatible storage bucket

```js
const buckets = await s3.listBuckets();
```

```json
{
   "Buckets":[
      {
         "Name":"bucket_name",
         "CreationDate":"2022-01-00T00":"00":00.000Z
      }
   ],
   "Owner":{
      "DisplayName":"bucket_display_name",
      "ID":"axxxbxxxcxxxxdxxxxe"
   }
}
```

3. To List all the files in aws s3 compatible storage bucket

```js
 objects = await s3.listObjects({ Bucket: bucketName }
```

```json
{
  "IsTruncated":false,
  "Marker":"",
  "Contents":[
    {
        "Key":"file_name",
        "LastModified":"2022-01-00T00":"00":00.000Z,
        "ETag":"\"axxxbxxxcxxxxdxxxxe\"",
        "ChecksumAlgorithm":[

        ],
        "Size":54376,
        "StorageClass":"STANDARD",
        "Owner":{
          "DisplayName":"bucket_display_name",
          "ID":"axxxbxxxcxxxxdxxxxe"
          }
      }
    ],
  "Name":"\"bucket_display_name\"",
  "Prefix":"",
  "Delimiter":"",
  "MaxKeys":1000,
  "CommonPrefixes": []
}

```

4. To Get the File from the aws s3 compatible storage bucket

```js
const object = await s3.getObject({ Bucket: bucketName, Key: key });
```

```json
{
   "AcceptRanges":"bytes",
   "LastModified":"2022-01-00T00":"00":00.000Z,
   "ContentLength":123456,
   "ETag":"\"axxxbxxxcxxxxdxxxxe\"",
   "ContentType":"image/jpeg",
   "Metadata":{},
   "Body":"<Buffer ff....>"
}
```

5. To delete all the selected file from the aws s3 compatible storage bucket

```js
await s3.deleteObject({ Bucket: bucketName, Key: fileName });
```

6. Function to upload file to the bucket using multer and multer-s3

- just save req.files.key to the database to retrive url for the user for the next time

```js
const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: "private",
    bucket: (req, file, cb) => {
      cb(null, req.body.selectBucket);
    },
    key: (request, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});
```

```json
//req.res.files
[
  {
    "fieldname": "uploadFilesInput",
    "originalname": "xxxxxxx.jpeg",
    "encoding": "7bit",
    "mimetype": "image/jpeg",
    "size": 12345,
    "bucket": "bucket_name",
    "key": "xxxxxxx.jpeg",
    "acl": "private",
    "contentType": "application/octet-stream",
    "contentDisposition": null,
    "contentEncoding": null,
    "storageClass": "STANDARD",
    "serverSideEncryption": null,
    "metadata": null,
    "location": "https://www.s3-endpoint/filename-something-something.jpeg",
    "etag": "\"axxxbxxxcxxxxdxxxxe\"",
    "versionId": undefined
  }
]
```

7. To Get the Secure Shareable link of File from the aws s3 compatible storage bucket

```js
const bucketName = req.params.bucketName;
const key = req.params.key;
const expiration = new Date();
expiration.setDate(expiration.getDate() + 1);
const params = {
  Bucket: bucketName,
  Key: key,
  Expires: expiration.getTime() / 1000, // expiration time in seconds
};
try {
  const url = await s3.getSignedUrlPromise("getObject", params);
  res.send({ url });
} catch (err) {
  res.send("Error getting object: " + err);
}
```

```json
{
  "url": "https://www.s3-endpoint/filename-something-something-with-time-to-expier.jpeg"
}
```
