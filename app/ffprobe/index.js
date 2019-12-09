"use strict"

const path = require('path')
const { exec } = require('child_process')

const { cwd, cmd } = getPath()

function getPath() {
	var { arch, platform } = process
	if (platform === 'darwin') return { cwd: path.join(__dirname, 'mac'), cmd: 'ffprobe'}
	else if (platform === 'win32') return { cwd: path.join(__dirname, 'win', arch), cmd: 'ffprobe.exe'}
}

function dataFormat(data) {
	var { format, streams } = data,
		{ bit_rate, duration, size } = format

	// format相关字段处理成number
	Object.assign(format, {
		bit_rate: +bit_rate,
		duration: +duration,
		size:     +size
	})

	// 比特率处理成number
	streams.forEach(stream => {
		stream.bit_rate = +stream.bit_rate
		if (stream.codec_type !== 'video') return

		var { coded_width, coded_height, width, height, display_aspect_ratio, r_frame_rate, sample_aspect_ratio, nb_frames } = stream

		var pixel_aspect_ratio = eval(sample_aspect_ratio.replace(':', '/')),	// 采样像素(宽高)比
			size_aspect_ratio  = eval(display_aspect_ratio.replace(':', '/')),	// 视频宽高比
			original_width     = ~~(coded_width * pixel_aspect_ratio)			// 原始宽

		var c_width  = ~~(coded_width * pixel_aspect_ratio),
			c_height = coded_height,
			_width   = ~~(width * pixel_aspect_ratio),
			_height  = height,
			c_ratio  = size_aspect_ratio - c_width / c_height,
			_ratio   = size_aspect_ratio - _width / _height

		// 添加新属性
		Object.assign(stream, {
			frames: +nb_frames,
			frame_rate: eval(r_frame_rate),							// 帧速率
			pixel_aspect_ratio,										// 像素比
			size_aspect_ratio,										// 尺寸比
			original_width:  c_ratio < _ratio? c_width:  _width,	// 原始宽
			original_height: c_ratio < _ratio? c_height: _height,	// 原始高
		})
		stream.pixel_total = stream.original_width * stream.original_height		// 帧像素数
	})

	return data
}

function getInfo(path) {
	return new Promise((resolve, reject) => {
		exec(`${cmd} -v quiet -show_format -show_streams -print_format json ${path}`, { cwd }, (error, stdout, stderr) => {
			if (error) {
				console.error(`执行的错误: ${error}`)
				return resolve()
			}
			var str = dataFormat(JSON.parse(stdout))
			resolve(str)
		})
	})
}
module.exports = getInfo