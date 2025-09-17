import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './s3Client.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadFileToS3 = async (file) => {
  const fileKey = `${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`; 
  return { key: fileKey ,
     url: fileUrl,
  };
};
