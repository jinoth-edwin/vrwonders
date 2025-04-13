const express = require('express');
const router = express.Router();
const { register, login, orders, getorders, updateOrderStatus, deleteOrder, neworder} = require('../controller/controller');

router.post('/register', register);
router.post('/login', login);
router.post('/orders', orders);
router.get('/getorders', getorders);
router.put('/update-order-status/:id', updateOrderStatus);
router.delete('/delete-order/:id', deleteOrder);
router.post('/neworder', neworder);
module.exports = router;
