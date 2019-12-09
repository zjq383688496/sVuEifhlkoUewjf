"use strict"

const path = require('path')
const { spawn } = require('child_process')
const { setProgress } = require('../utils')

const { cwd, cmd } = getPath()

function getPath() {
	var { arch, platform } = process
	if (platform === 'darwin') return { cwd: path.join(__dirname, 'mac'), cmd: 'ffmpeg'}
	else if (platform === 'win32') return { cwd: path.join(__dirname, 'win', arch), cmd: 'ffmpeg.exe'}
}

// 分析流
function analysis(streams) {
	var obj = {}
	streams.forEach(stream => {
		var { codec_type } = stream
		if (codec_type === 'video' && !obj.video) obj.video = stream
		else if (codec_type === 'audio' && !obj.audio) obj.audio = stream
	})
	return obj
}

// 生成编码配置
function createArgs({ video, audio }, _path, max_width, filename) {
	let { bit_rate, codec_name, frame_rate, original_width, original_height, pixel_total, size_aspect_ratio } = video,
		bit_pixel_rate = bit_rate / pixel_total,				// 比特率/像素
		video_en = ' -c:v copy',								// 视频编码 (默认 复制)
		audio_en = '',
		source   = `-re -y -i ${_path}`,						// 数据来源
		output   = ` -f mp4 ${filename}`,						// 输出文件
		frame    = frame_rate <= 30? '': ' -r 30',				// 帧率
		maxSide  = Math.max(original_width, original_height),	// 最大边
		size     = ''

	// 重新计算尺寸
	if (maxSide === original_width && original_width > max_width) {
		original_width = max_width
		original_height = ~~(original_width / size_aspect_ratio)
		size = ` -s ${original_width}x${original_height}`
	} else if (maxSide === original_height && original_height > max_width) {
		original_height = max_width
		original_width = ~~(original_width * size_aspect_ratio)
		size = ` -s ${original_width}x${original_height}`
	}

	// 如果尺寸重置 则重新计算 比特率/像素
	if (size) {
		pixel_total = original_width * original_height
		bit_pixel_rate = bit_rate / pixel_total
	}
	
	// 重新计算比特率(视频)
	if (bit_pixel_rate > 0.7) {
		var bit = ~~(pixel_total * 0.7 / 1000)
		video_en = ` -c:v libx264 -profile:v baseline -level 3 -preset medium -b:v ${bit}k`
	}

	// 重新计算比特率(音频)
	if (audio) {
		audio_en = ' -c:a copy'
		if (audio.bit_rate > 1e5) audio_en = ' -c:a aac -b:a 64k'
	}

	const args = (source + size + frame + video_en + audio_en + output)

	console.log('args: ', args)

	return args.split(/\s+/)
}

function videoEncode({ format, streams }, { _path, filename, max_width = 1920 }) {
	max_width = +max_width
	return new Promise((resolve, reject) => {
		let result = analysis(streams),
			{ video } = result
		if (!video) return resolve(_path)

		let { frames } = video
		let args = createArgs(result, _path, max_width, filename)

		console.log(cwd, cmd)
		console.log({ format, streams })

		const ffmpeg = spawn(cmd, args, { cwd })

		ffmpeg.stderr.on('data', data => {
			data += ''	// 信息转string
			if(!/^frame=/.test(data)) return
			// 解析已转帧数
			var mt = data.match(/frame=(\s+)?(\d+)/)
			if (!mt) return
			var frame    = +mt[2],
				progress = 10 + Math.round(60 * frame / frames)
			setProgress(progress)
		})

		ffmpeg.stdout.on('data', data => {
			console.log('stdout: ', '' + data)
		})

		ffmpeg.on('close', code => {
			console.log(`子进程退出，退出码: ${code}`)
			resolve()
		})
	})
}
module.exports = videoEncode