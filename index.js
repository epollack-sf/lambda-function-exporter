const { spawn } = require('node:child_process');
const https = require('node:https');
const fs = require('node:fs');

const getFunctionData = () => new Promise((resolve, reject) => {
    const fileName = process.argv[2];
    const command = 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe';
    const args = [
        'lambda',
        'get-function',
        '--function-name',
        `${fileName}`
    ];
    const child_process = spawn(command, args);

    let data = '';
    child_process.stdout.on('data', d => data += d);

    child_process.on('error', (err) => console.error(err));
    child_process.on('close', (code) => {
        if (code != 0) {
            reject('child process exited with a non-zero exit code');
        } else {
            const json = JSON.parse(data);
            resolve(json.Code.Location);
        }
    })
});

const downloadCode = (url) => new Promise((resolve, reject) => {
    const cb = (res) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
            reject(new Error('bad response'));
        }

        const file = fs.createWriteStream(`./backups/${process.argv[2]}.zip`);

        res.on('data', d => file.write(d));
        res.on('end', () => resolve());
    }

    const parsableUrl = new URL(url);
    const options = {
        hostname: parsableUrl.hostname,
        path: parsableUrl.pathname + parsableUrl.search,
        encoding: null
    };

    const req = https.get(options, cb);
    req.on('error', err => reject(err));

    req.end();
});

const main = async () => {
    await downloadCode(await getFunctionData());
};

main().then(() => console.log('done!')).catch(({ message }) => console.log('An error occurred', message));