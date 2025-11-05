const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
    region: region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
})


function uploadFile(fileBuffer, fileName, mimetype) {
    const uploadParams = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: fileName,
        ContentType: mimetype
    }

    return s3Client.send(new PutObjectCommand(uploadParams));
}

function deleteFile(fileName){
    const deleteParams ={
        Bucket:bucketName,
        Key:fileName
    }

    return s3Client.send(new DeleteObjectCommand(deleteParams))
}

function uploadFileToFolder(fileBuffer, fileName, mimetype, folderPath) {
    // Ensure folderPath ends with a '/'
    if (folderPath && !folderPath.endsWith('/')) {
        folderPath += '/';
    }
    const uploadParams = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: `${folderPath}${fileName}`, // Add the folder path to the file name
        ContentType: mimetype
    };
    return s3Client.send(new PutObjectCommand(uploadParams));
}


module.exports = {
    uploadFile,
    deleteFile,
    uploadFileToFolder
}


