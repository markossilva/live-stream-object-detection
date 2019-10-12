const { spawn } = require('child_process');
const filter = require('stream-filter');

const { server } = require('./config');

const streamArgs = [
	'-f',
	'image2pipe',
	'-i',
	'-',
	'-f',
	'mpegts',
	'-c:v',
	'mpeg1video',
	// "-q",
	// "10",
	'-b:v',
	'1000k',
	'-maxrate:v',
	'1000k',
	'-bufsize',
	'500k',
	'-an',
	`http://localhost:${server.streamPort}/${server.streamSecret}`
];

const ffmpegStream = spawn('ffmpeg', streamArgs);
ffmpegStream.stdin.setEncoding('binary');

const detectionStream = spawn('node', ['utils/detection.js']);
detectionStream.stdout.setDefaultEncoding('binary');

const stream = () => {
	detectionStream.stdout
		.pipe(
			filter((data) => {
				// filter opencv output, example: '[ INFO:0] Initialize OpenCL runtime...'
				const regex = /\[\sINFO:\d\]\s/gm;
				const isImgData = !regex.test(data);
				return isImgData;
			})
		)
		.pipe(ffmpegStream.stdin);

	ffmpegStream.stdout.on('data', (data) => {
		console.log('stdout: ' + data.toString());
	});

	ffmpegStream.stderr.on('data', (data) => {
		console.log('stderr: ' + data.toString());
	});

	ffmpegStream.on('exit', (code) => {
		console.log('child process exited with code ' + code.toString());
	});
};

module.exports = stream;
