

const exec = require('child_process').execFileSync;

require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const crypto = require('crypto')

const app = express();

app.get('/', (req, res) => {
	res.send('Hello there, public world');
})


app.post('/update', bodyParser.json({
	verify: (req, res, buf, encoding) => {
		const secretDigest = crypto.createHmac('sha1', process.env.GH_HOOK_SECRET);
		secretDigest.update(buf);
		const secretSig = secretDigest.digest('hex');
		const inputSecret = req.headers['x-hub-signature'];
		if (inputSecret !== 'sha1='+secretSig) {
			throw new Error('Invalid secret checksum');
		}
	}
}), (req, res) => {
	console.log('update from gh')
	console.log(req.body)
	const result = exec('git', ['pull']);
	console.log('git pull', result.toString());
	const result2 = exec('yarn');
	console.log('yarn', result2.toString());
	const result3 = exec('sudo', ['/usr/bin/systemctl', 'restart', 'titan']);
	console.log('restart titan', result3.toString());


	res.send('thanks github');
})

app.listen(8899, () => {
	console.log('server started on 8899')
});