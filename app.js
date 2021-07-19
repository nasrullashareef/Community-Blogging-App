const express = require ('express')
const app = express()
const router = require('./router')
const session = require('express-session')
const flash = require ('connect-flash')
const mongoStore = require('connect-mongo')(session)
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/api', require('./router-api'))


let sessionOptions= session({
    secret: "Javascript is soooo coooool",
    store : new mongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie : {maxAge: 1000*60*60*24, httpOnly:true}
})

app.use(sessionOptions)
app.use(flash())


app.use(function(req, res, next){
    //make markdown function available from ejs
    res.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content), {allowedTags:['p','br','ol','ul','li','i','em','bold','italic','h1','h2','h3','h4','h5','h6',], allowedAttributes:{} })
    }

    //make all error and success flash messages available from all templates
    res.locals.errors= req.flash("errors")
    res.locals.success= req.flash("success")
    
    //make current userid available for req object
    if(req.session.user) {req.visitorId=req.session.user._id}
    else{req.visitorId=0}

    //make user session data available from within view templates
    res.locals.user= req.session.user
     next()
})


app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')


app.use('/', router)

/*const http = require('http')
const server = http.createServer(app)
//const io = new Server(server)*/

const server = require('http').createServer(app)

const io = require('socket.io')(server)

io.on('connection', function(socket) {
  socket.on('chatMessageFromBrowser', function(data) {
    io.emit('chatMessageFromServer', {message: data.message})
  })
})

module.exports = server