import axios from 'axios'

const md5 = (str) => {
  const cr = require('crypto')
  const md5 = cr.createHash('md5')
  md5.update(str)
  const result = md5.digest('hex')
  return result.toUpperCase()  //32位大写
}

const buildLine = (title, subTitle = '') => {
  return {
    title,
    subTitle,
    action() {
    }
  }
}

let timeout
let appKey, appSecret

function getData({query, utils: {logger}}) {
  if (timeout) clearTimeout(timeout)
  return new Promise(resolve => {
    timeout = setTimeout(() => {
      const salt = new Date().getTime()
      // appKey+q+salt+密钥
      const sign = md5(appKey + query + salt + appSecret)
      if (!appKey || !appSecret) return resolve([buildLine('未配置AppKey或者AppSecret', '请正确配置AppKey或者AppSecret')])

      const request = `http://openapi.youdao.com/api?q=${encodeURIComponent(query)}&appKey=${appKey}&from=auto&to=auto&salt=${salt}&sign=${sign}`
      axios.get(request).then((res) => {
        const resultList = []
        // 无结果处理
        if (!query) {
          return resultList
        }

        const {basic, translation: [translate]} = res.data
        // 查词成功
        if (basic) {
          const {explains, phonetic} = basic
          if (phonetic) {
            resultList.push(buildLine(translate, `[${phonetic}]`))
          }
          explains.forEach(item => {
            resultList.push(buildLine(item, query))
          })
        } else {
          // 查词失败
          // 翻译失败
          if (query === translate) {
            resultList.push(buildLine('暂时没有合适的结果', '继续输入可能会不一样哦'))
            return resolve(resultList)
          }
          // 翻译成功
          resultList.push(buildLine(translate, query))
        }
        resolve(resultList)
      })
    }, 200)
  })
}

// 存入剪切板 windows
const pbcopyWin = (data) => {
  require('child_process').spawn('clip').stdin.end(util.inspect(data.replace('\n', '\r\n')))
}
module.exports = {
  name: 'YouDao',
  quick: 'yd',
  icon: '',
  init() {
    const config = require('./config.json')
    appKey = config.appKey
    appSecret = config.appSecret
  },
  query: (pluginContext) => {
    return getData(pluginContext)
  }
}
