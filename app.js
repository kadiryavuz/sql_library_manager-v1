var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var books = require('./routes/books');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/books', books);

//error handling for not found routes
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
})

app.use((err, req, res, next) => {
    let errData;
    let statusCode = err.status;
    switch (statusCode) {
        case 404:
            errData = {
                title: "Page Not Found",
                desc: "Sorry! We couldn't find the page you were looking for."
            }
            break;
        case 500:
            errData = {
                title: "Internal Error",
                desc: "Sorry! Something has gone wrong."
            }
            break;
        default:
            
            errData = {
                title: "Is this a bug?",
                desc: "No worries! We are already checking this case"
            }
    }
    // if (statusCode === 404) {

    // } else if (statusCode)
    //     const statusCode = err.status || 500;
    // const errData = { message: err.message, error: err };
    res.status(statusCode);
    res.render('page-not-found', {
        title: "Page Not Found", err: errData
    });
})

app.listen(3000, () => {
    console.log("App is listening on port: 3000");
})

module.exports = app;