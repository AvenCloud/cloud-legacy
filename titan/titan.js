
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.send('Titan Server');
});

app.listen(8888, () => {
	console.log('server started on 8888')
});