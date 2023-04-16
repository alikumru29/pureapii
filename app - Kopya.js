const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors'); // CORS paketini dahil edin

const API_USERNAME = 'uzum';
const API_PASSWORD = '123456aA';
const app = express();
const cache = new NodeCache();

app.use(cors());
app.use(express.json());

let currentPage = 0;
const pageSize = 25;


const loginUrl = 'https://bayi.pureconcept.com.tr/rest1/auth/login/' + API_USERNAME;

async function getToken() {
  const response = await axios.post(loginUrl, 'password=' + encodeURIComponent(API_PASSWORD), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  console.log(response.data);
  return response.data.data.token;
}

async function pay(token, customerId, start, length) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/report/provisionReports';
  const postData = {
    searchData: {
      customer_id: customerId,
    },
    pagingData: {
      start: start,
      length: length,
      order: [['id', 'desc']],
    },
  };
  const response = await axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
      Token: token,
    },
  });

  console.log("API'den dönen veri:", response.data.data);
  const approvedData = response.data.data.filter(item => item.approval === true);
  return approvedData;
}





async function fundmovements(token, customerId, start, length) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/fundMovement/getFundMovements';
  const postData = {
    searchData: {
      customer_id: customerId
    },
    pagingData: {
      start: start,
      length: length,
      order: [['id', 'desc']],
    },
  };
  const response = await axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
      Token: token,
    },
  });

  console.log(response.data);
  return response.data.data;
}


async function orders(token, customerId, start, length) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/order/getOrders';
  const postData = {
    data: {
      customer_id: customerId
    },
    option: {
      is_detail: true
    },
    pagingData: {
      start: start,
      length: length,
      order: [['id', 'desc']],
    },
  };
  const response = await axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
      Token: token,
    },
  });

  console.log(response.data);
  return response.data.data;
}


app.post('/fundMovement/pay', async (req, res) => {
  try {
    const customerId = req.body.customerId;
    const page = req.body.page || 0;
    const start = page * pageSize;
    const token = await getToken();
    const data = await pay(token, customerId, start, pageSize);
    console.log('pay() fonksiyonundan dönen veri:', data);
    res.json(data);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).send('Bir hata oluştu');
  }
});



app.post('/fundMovement/getFundMovements', async (req, res) => {
  try {
    const customerId = req.body.customerId;
    const page = req.body.page || 0;
    const start = page * pageSize;
    const token = await getToken();
    const data = await fundmovements(token, customerId, start, pageSize);
    res.json(data);
  } catch (error) {
    console.error('Hata: ', error.message);
    res.status(500).send('Bir hata oluştu');
  }
});



app.post('/order/getOrders', async (req, res) => {
  try {
    const customerId = req.body.customerId;
    const page = req.body.page || 0;
    const start = page * pageSize;
    const token = await getToken();
    const data = await orders(token, customerId, start, pageSize);
    res.json(data);
  } catch (error) {
    console.error('Hata: ', error.message);
    res.status(500).send('Bir hata oluştu');
  }
});




app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde çalışıyor');
});