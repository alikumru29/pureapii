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



async function pay(token, customerId, start, length, minDate, maxDate) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/report/provisionReports';
  const postData = {
    searchData: {
      customer_id: customerId,
      date_min: minDate,
      date_max: maxDate,
    },
    pagingData: {
      start: start,
      length: length,
      order: [['id', 'asc']],
    },
  };
  const response = await axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
      Token: token,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    },
  });

  console.log("API'den dönen veri:", response.data.data);
  const approvedData = response.data.data.filter(item => item.approval === true);
  return approvedData;
}


async function fundmovements(token, customerId, start, length, minDate, maxDate) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/fundMovement/getFundMovements';
  const postData = {
    searchData: {
      customer_id: customerId,
      date_min: minDate,
      date_max: maxDate,
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


async function orders(token, customerId, start, length, status, minDate, maxDate) {
  const url = 'https://bayi.pureconcept.com.tr/rest1/order/getOrders';
  const postData = {
    data: {
      customer_id: customerId,
      status: status,
      minDate: minDate,
      maxDate: maxDate,
    },
    options: {
      is_detail: true,
    },
    pagingData: {
      start: start,
      length: length,
      order: [['id', 'asc']],
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
    const minDate = req.body.minDate;
    const maxDate = req.body.maxDate;
    const token = await getToken();
    const data = await pay(token, customerId, start, pageSize, minDate, maxDate);
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
    const minDate = req.body.minDate;
    const maxDate = req.body.maxDate;
    const token = await getToken();
    const data = await fundmovements(token, customerId, start, pageSize, minDate, maxDate);
    res.json(data);
  } catch (error) {
    console.error('Hata: ', error.message);
    res.status(500).send('Bir hata oluştu');
  }
});



app.post('/order/getOrders', async (req, res) => {
  try {
    const statusValues = req.body.statusValues || [-16, -12, -3, -6 -8];
    const customerId = req.body.customerId;
    const page = req.body.page || 0;
    const start = page * pageSize;
    const minDate = req.body.minDate;
    const maxDate = req.body.maxDate;
    const token = await getToken();

    let filteredOrders = [];
    for (const status of statusValues) {
      const ordersData = await orders(token, customerId, start, pageSize, status, minDate, maxDate);
      filteredOrders = filteredOrders.concat(ordersData);
    }

    res.json(filteredOrders);
  } catch (error) {
    console.error('Hata: ', error.message);
    res.status(500).send('Bir hata oluştu');
  }
});



app.post('/order/getOrders/bekleyen', async (req, res) => {
  req.body.statusValues = [-16, -12, -3, -6];
  app.emit('bekleyen', req, res);
});

app.post('/order/getOrders/verilen', async (req, res) => {
  req.body.statusValues = [-16, -12, -3, -6, -8];
  app.emit('verilen', req, res);
});

app.post('/order/getOrders/tamamlanan', async (req, res) => {
  req.body.statusValues = [-8];
  app.emit('tamamlanan', req, res);
});

app.on('bekleyen', async (req, res) => {
  await handleOrderRequest(req, res);
});

app.on('verilen', async (req, res) => {
  await handleOrderRequest(req, res);
});

app.on('tamamlanan', async (req, res) => {
  await handleOrderRequest(req, res);
});

async function handleOrderRequest(req, res) {
  try {
    const customerId = req.body.customerId;
    const page = req.body.page || 0;
    const start = page * pageSize;
    const minDate = req.body.minDate;
    const maxDate = req.body.maxDate;
    const statusValues = req.body.statusValues;
    const token = await getToken();

    let filteredOrders = [];
    for (const status of statusValues) {
      const ordersData = await orders(token, customerId, start, pageSize, status, minDate, maxDate);
      filteredOrders = filteredOrders.concat(ordersData);
    }

    res.json(filteredOrders);
  } catch (error) {
    console.error('Hata: ', error.message);
    res.status(500).send('Bir hata oluştu');
  }
}







app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde çalışıyor');
});