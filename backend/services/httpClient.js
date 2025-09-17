import axios from 'axios';

const httpClient = axios.create({
  timeout: 3 * 60 * 1000, // 3 minutes
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

export default httpClient;
