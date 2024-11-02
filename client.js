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
    const msg = JSON.parse(data.toString());
    setTimeout(() => {
        if (msg.type == "hello") {
            client.write(JSON.stringify({ "agent": "client-nablotech", "type": "hello", "version": "0.10.3" })+ "\n");
        } else if (msg.type == "getpeers") {
            client.write(JSON.stringify({ "type": "peers", "peers": ["192.168.0.1:213", "192.168.0.1:233","google.com:503"] }) + "\n");
            
            setTimeout(()=>{
                client.write(JSON.stringify({ "type": "ge" })); 
                setTimeout(()=>{
                    client.write(JSON.stringify({ "type": "tpeers" }) + "\n");  
                },2000) 
            },4000)

        }

    }, 3000);


});

// Event handler for handling connection end
client.on('end', () => {
    console.log('Disconnected from server.');
});

// Event handler for errors
client.on('error', (err) => {
    console.error('Connection error:', err);
});
