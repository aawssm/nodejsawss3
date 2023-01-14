const { S3 } = require("aws-sdk");
const dotenv = require("dotenv").config();
const https = require("https");
const multer = require("multer");
const multerS3 = require("multer-s3");
const express = require("express");
const cors = require("cors");
const corsOptions = {
    origin: "*",
    credentials: true, // access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };

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
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/views"));
app.set("view engine", "ejs");
app.set("views", "./views"); // specify the views director


app.get("/", async (req, res) => {
    res.redirect(`/bucket`);
});

app.get("/bucket", async (req, res) => {
    try {
        const params = req.query.api;
        const buckets = await s3.listBuckets().promise();
        const bucketList = buckets.Buckets.map((b) => b.Name);
        if (params === undefined)
            res.render("index", { bucketList: bucketList });
        else
            res.send(buckets.Buckets);
    } catch (err) {
        res.send("Error listing buckets: " + err);
    }
});
app.get("/buckets", async (req, res) => {
    try {
        const buckets = await s3.listBuckets().promise();
        res.send(buckets.Buckets);
    } catch (err) {
        res.send("Error listing buckets: " + err);
    }
});

app.get("/bucket/:bucketName/:folder?", async (req, res) => {
    const bucketName = req.params.bucketName;
    const folder = req.params.folder;
    try {
        let objects;
        let addToUrl = "";
        if (folder !== undefined) {
            addToUrl = folder + "/";
            objects = await s3
                .listObjects({ Bucket: bucketName, Prefix: folder })
                .promise();
        } else {
            objects = await s3.listObjects({ Bucket: bucketName }).promise();
        }
        const folders = {};
        //sort items into files and folders
        objects.Contents.forEach((o) => {
            o.Key = o.Key.replace(folder + "/", "");
            const parts = o.Key.split("/");
            if (parts.length > 1) {
                const folder = parts[0];
                if (!folders[folder]) {
                    folders[folder] = [];
                }
                folders[folder].push(o);
            } else {
                if (!folders["."]) {
                    folders["."] = [];
                }
                folders["."].push(o);
            }
        });

        res.render("filesfolder", { bucketName, addToUrl, folders: folders });
    } catch (err) {
        res.send("Error listing objects: " + err);
    }
});

app.get("/file/:bucketName/:key", async (req, res) => {
    const bucketName = req.params.bucketName;
    const key = req.params.key;
    try {
        const object = await s3
            .getObject({ Bucket: bucketName, Key: key })
            .promise();
        res.render("fils", { bucketName, key, object });
    } catch (err) {
        res.send("Error getting object: " + err);
    }
});

app.get("/share/:bucketName/:key", async (req, res) => {
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
        res.send(url);
    } catch (err) {
        res.send("Error getting object: " + err);
    }
});
app.post("/delete/:bucketName/:fileName", async (req, res) => {
    const bucketName = req.params.bucketName;
    const fileName = req.params.fileName;
    let orignPathArry = fileName.split("/");
    orignPathArry.pop();
    try {
        const object = await s3
            .deleteObject({ Bucket: bucketName, Key: fileName })
            .promise();
        res.redirect(
            `/bucket/${bucketName}/${encodeURIComponent(orignPathArry.join("/"))}`
        );
    } catch (err) {
        res.send("Error deleting object: " + err);
    }
});
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

app.get("/upload", (req, res) => {
    res.sendFile(__dirname + "/views/upload.html");
});

app.post("/upload", upload.array("uploadFilesInput"), (req, res) => {
    res.send("File(s) uploaded successfully");
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
});
