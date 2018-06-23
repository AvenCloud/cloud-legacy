
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.send('Hyperion2!');
});

app.get('/keys.public.txt', (req, res) => {
	res.send(require('fs').readFileSync('/home/bot/.ssh/id_rsa.pub'));
});

app.listen(8880, () => {
	console.log('server started on 8880')
});
