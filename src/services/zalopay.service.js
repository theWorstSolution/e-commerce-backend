// Node v10.15.3
const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js
const moment = require('moment'); // npm install moment
const qs = require('qs');
const { orderService } = require('.');

// APP INFO
const config = {
    app_id: "2553",
    key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
    key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create",
    queryEndpoint: "https://sb-openapi.zalopay.vn/v2/query"
};


/**
 * 
 * @returns redirect url to zalopay gateway for fe
 */
async function createOrder(userId, orderIds, totalCost) {
    const embed_data = {
        preferred_payment_method: [],
        redirecturl: 'http://localhost:3033/buy-success',
        userId,
        orderIds,
        totalCost
    };

    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`
    const order = {
        app_id: config.app_id,
        app_trans_id, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
        app_user: userId,
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: totalCost,
        description: `BKSHOP - Payment for the order #${transID}`,
        bank_code: "",
        callback_url: 'https://22f3-42-114-151-157.ngrok-free.app/v1/orders/zalopayCallback'
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const res = await axios.post(config.endpoint, null, { params: order })



    // set interval for check status of order
    let postData = {
        app_id: config.app_id,
        app_trans_id, // Input your app_trans_id
    }

    let dataForMac = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
    postData.mac = CryptoJS.HmacSHA256(dataForMac, config.key1).toString();


    let postConfig = {
        method: 'post',
        url: config.queryEndpoint,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(postData)
    };

    const checkOrderStatus = setInterval(async () => {
        const { data } = await axios(postConfig)
        console.log(JSON.stringify(data));
        switch (data.return_code) {
            case 1: // success
                for (let orderId of orderIds) {
                    const order = await orderService.getOrderById(orderId)
                    if (order.hasPaid == false) {
                        order.hasPaid = true;
                        await order.save();
                        const product = await productService.getProductById(order.product)
                        product.soldAmount += order.amount
                        await product.save()
                    }

                }
            case 2: // failed
                clearInterval(checkOrderStatus)
        }
    }, 60000);

    setTimeout(() => {
        clearInterval(checkOrderStatus)
    }, 900000)




    // console.log(res.data);
    return res.data.order_url

}

/**
 * check validity of mac. then parse data
 * @param {*} data 
 * @param {*} mac 
 * @returns 
 */
function checkCallback(data, mac) {
    let result = {};

    try {
        let dataStr = data;
        let reqMac = mac;

        mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
        console.log("mac =", mac);


        // kiểm tra callback hợp lệ (đến từ ZaloPay server)
        if (reqMac !== mac) {
            // callback không hợp lệ
            result.return_code = -1;
            result.return_message = "mac not equal";
            // console.log('not successs');
        }
        else {
            // thanh toán thành công
            // merchant cập nhật trạng thái cho đơn hàng
            var dataJson = JSON.parse(dataStr, config.key2);
            // console.log("update order's status = success where app_trans_id =", dataJson["app_trans_id"]);
            dataJson.embed_data = JSON.parse(dataJson.embed_data)
            result.return_code = 1;
            result.return_message = "success";
            // console.log('successs');
            // console.log(JSON.stringify(dataJson,null,2));

        }
    } catch (ex) {
        result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
        result.return_message = ex.message;
    }
    return { dataJson, result }




}

module.exports = {
    createOrder,
    checkCallback
};