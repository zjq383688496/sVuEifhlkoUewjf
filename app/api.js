const router = require('koa-router')()
const { upload } = require('./model')

router.prefix('/')

router.post('/upload', upload)

module.exports = router