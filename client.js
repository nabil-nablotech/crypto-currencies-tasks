const net = require('net');

// Define the server's IP address and port
const HOST = '127.0.0.1'; // Replace with your server IP
const PORT = 18018;        // Replace with your server port

// Create a connection to the server
const client = net.createConnection({ host: HOST, port: PORT }, () => {
    console.log('Connected to server!');

    // Send a message to the server after connecting

});

// Event handler for receiving data from the server
client.on('data', (data) => {
    console.log('Received from server:', data.toString());
    const msg = JSON.parse(data.toString().split("\n")[0]);
    if (msg.type == "hello") {
        client.write(JSON.stringify({ "agent": "client-nablotech", "type": "hello", "version": "0.10.3" }) + "\n");
        client.write(JSON.stringify({ "type": "peers", "peers": ["192.168.0.1:213", "192.168.0.1:233", "google.com:503"] }) + "\n");

        setTimeout(() => client.write(JSON.stringify({ "type": "getmempool" }) + "\n"), 7000)
        // client.write(JSON.stringify({ "type": "ihaveobject", objectid: "d46d09138f0251edc32e28f1a744cb0b7286850e4c9c777d7e3c6e459b289347" }) + "\n");
        // client.write(JSON.stringify({ "type": "ihaveobject", objectid: "895ca2bea390b7508f780c7174900a631e73905dcdc6c07a6b61ede2ebd4033f" }) + "\n");
        // client.write(JSON.stringify({ "type": "ihaveobject", objectid: "895ca2bea390b7508f780c7174900a631e73905dcdc6c07a6b61ede2ebd4033f" }) + "\n");

        //GENESIS block
        // client.write(JSON.stringify({
        //     type: "object",
        //     object: {
        //         T: "00000000abc00000000000000000000000000000000000000000000000000000",
        //         created: 1671062400,
        //         miner: "Marabu",
        //         nonce: "000000000000000000000000000000000000000000000000000000021bea03ed",
        //         note: "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
        //         previd: null,
        //         txids: [],
        //         type: "block"
        //     }

        // }) + "\n");

        // // Sending secondblock
        // client.write(JSON.stringify({
        //     type: "object",
        //     object: {
        //         T: "00000000abc00000000000000000000000000000000000000000000000000000",
        //         created: 1671148800,
        //         miner: "grader",
        //         nonce: "1000000000000000000000000000000000000000000000000000000001aaf999",
        //         note: "This block has a coinbase transaction",
        //         previd: "0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2",
        //         txids: [
        //             "6ebfb4c8e8e9b19dcf54c6ce3e1e143da1f473ea986e70c5cb8899a4671c933a"
        //         ],
        //         type: "block"
        //     }


        // }) + "\n");
    } else if (msg.type == "getmempool") {
        client.write(JSON.stringify({ "type": "mempool", "txids": [] }) + "\n");

    } /* else if (msg.type == "getobject") {
        if (msg.objectid == "d46d09138f0251edc32e28f1a744cb0b7286850e4c9c777d7e3c6e459b289347") {
            client.write(JSON.stringify({
                type: "object",
                object: {
                    height: 0,
                    outputs: [
                        {
                            pubkey: "85acb336a150b16a9c6c8c27a4e9c479d9f99060a7945df0bb1b53365e98969b",
                            value: 50000000000000
                        }
                    ],
                    type: "transaction"
                }
            }) + "\n");
        } else if (msg.objectid == "895ca2bea390b7508f780c7174900a631e73905dcdc6c07a6b61ede2ebd4033f") {
            const object = {
                object: {
                    inputs: [
                        {
                            outpoint: {
                                index: 0,
                                txid: "d46d09138f0251edc32e28f1a744cb0b7286850e4c9c777d7e3c6e459b289347"
                            },
                            sig: "6204bbab1b736ce2133c4ea43aff3767c49c881ac80b57ba38a3bab980466644cdbacc86b1f4357cfe45e6374b963f5455f26df0a86338310df33e50c15d7f04"
                        }
                    ],
                    outputs: [
                        {
                            pubkey: "b539258e808b3e3354b9776d1ff4146b52282e864f56224e7e33e7932ec72985",
                            value: 10
                        },
                        {
                            pubkey: "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                            value: 49999999999990
                        }
                    ],
                    type: "transaction"
                },
                type: "object"
            }
            client.write(JSON.stringify({ ...object }) + "\n");
        }


    }
 */

});

// Event handler for handling connection end
client.on('end', () => {
    console.log('Disconnected from server.');
});

// Event handler for errors
client.on('error', (err) => {
    console.error('Connection error:', err);
});
