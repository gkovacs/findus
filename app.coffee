express = require 'express'
app = express()
http = require 'http'
httpserver = http.createServer(app)
httport = process.env.PORT ? 5000
httpserver.listen(httport, '0.0.0.0')
webRoot = 'http://findus.herokuapp.com/'

app.configure('development', () ->
  app.use(express.errorHandler())
)

app.configure( ->
  app.set('views', __dirname + '/static')
  app.set('view engine', 'ejs')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.set('view options', { layout: false })
  app.locals({ layout: false })
  app.use(express.static(__dirname + '/static'))
  app.use(app.router);
)

app.get '/', (req, res) ->
  target = generateRandomLowercaseAlphabeticString(7)
  res.redirect(target)

lowercasealphabet = 'abcdefghijklmnopqrstuvwxyz'

generateRandomLowercaseAlphabeticString = (length) ->
  output = []
  while output.length < length
    curChar = lowercasealphabet[Math.floor(Math.random() * lowercasealphabet.length)]
    output.push curChar
  return output.join('')

alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

isAlphanumericString = (str) ->
  for c in str
    if alphanumeric.indexOf(c) == -1
      return false
  return true

pageToUsers = {} # pageid -> userid -> {timestamp last active, coordinates}

app.get '/sendInfo', (req, res) ->
  pageid = req.query.pageid
  userid = req.query.userid
  latitude = parseFloat(req.query.latitude)
  longitude = parseFloat(req.query.longitude)
  if not pageid? or not userid? or not latitude? or not longitude?
    res.send(404)
    return
  if not pageToUsers[pageid]?
    pageToUsers[pageid] = {}
  if not pageToUsers[pageid][userid]?
    pageToUsers[pageid][userid] = {}
  currentTime = Math.round(new Date().getTime()/1000.0) # unix time, seconds
  pageToUsers[pageid][userid].updateTime = currentTime
  pageToUsers[pageid][userid].latitude = latitude
  pageToUsers[pageid][userid].longitude = longitude
  usersToDelete = []
  for currentUserId of pageToUsers[pageid]
    if pageToUsers[pageid][currentUserId].updateTime + 86400 < currentTime
      usersToDelete.push currentUserId
  for currentUserId in usersToDelete
    delete pageToUsers[pageid][currentUserId]
  res.send(JSON.stringify(pageToUsers[pageid]))

app.get '/getInfo', (req, res) ->
  pageid = req.query.pageid
  if not pageid?
    res.send(404)
    return
  if not pageToUsers[pageid]?
    res.send('{}')
    return
  currentTime = Math.round(new Date().getTime()/1000.0) # unix time, seconds
  usersToDelete = []
  for currentUserId of pageToUsers[pageid]
    if pageToUsers[pageid][currentUserId].updateTime + 86400 < currentTime
      usersToDelete.push currentUserId
  for currentUserId in usersToDelete
    delete pageToUsers[pageid][currentUserId]
  res.send(JSON.stringify(pageToUsers[pageid]))

app.get '/*', (req, res) ->
  pageid = req.params[0]
  if not isAlphanumericString(pageid)
    res.send(404)
  else
    console.log 'rendering'
    webpageURIEncoded = encodeURI(webRoot + pageid)
    res.render('main.ejs', {'pageid': pageid, 'webRoot': webRoot, 'webpage': webRoot + pageid, 'webpageSansHTTP': webRoot[7..] + pageid, 'webpageURIEncoded': webpageURIEncoded}, (err, html) ->
      console.log 'done rendering'
      console.log err
      console.log html
      res.send(html)
    )

