var express = require('express');
var router = express.Router();
const { Op } = require("sequelize");

var Book = require('../models/book');

// a method to return custom 500 error to be controlled within the routes below where necessary
const getCustomErr = () => {
    let err = new Error("Custom 500 error");
    err.status = 500;

    return err;
}

// Shows the full list of books.
router.get('/', (req, res, next) => {
    //according to the logic I built, before rendering page with filtered/ limited data
    //I implemented count fn to get the exact total number of results with original where condition if any
    Book.count()
        .then(s => {
            const limit = 5;
            const solidPages = Math.floor(s / limit);
            let pageCount = (s % limit > 0) ? solidPages + 1 : (s > 0) ? solidPages : solidPages + 1;
            let calcOffset = 0 * limit;

            Book.findAll({ offset: calcOffset, limit, order: [["createdAt", "DESC"]] })
                .then((books) => {


                    res.render("books/index", { books, title: "Books", paging: { pageCount, active: 0 } })
                }).catch(err => {
                    err.status = 500;
                    next(err);
                });
        }).catch(err => {
            err.status = 500;
            next(err);
        })


})

//diplay results with paging
//once user involves UI action with paging buttons, this route is going to handle the rest
//I wanted to keep original index route as is (w/o optional params)
router.get('/list/:page', (req, res, next) => {
    const { page } = req.params;
    const limit = 5;
    let calcOffset = (page - 1) * limit;

    //according to the logic I built, before rendering page with filtered/ limited data
    //I implemented count fn to get the exact total number of results with original where condition if any
    Book.count()
        .then(s => {
            const solidPages = Math.floor(s / limit);
            let pageCount = (s % limit > 0) ? solidPages + 1 : (s > 0) ? solidPages : solidPages + 1;
            Book.findAll({ offset: calcOffset, limit, order: [["createdAt", "DESC"]] })
                .then((books) => {
                    res.render("books/index", { books, title: "Books", paging: { pageCount, active: Number(page) } })
                }).catch(err => {
                    err.status = 500;
                    next(err);
                });
        })
        .catch(err => {
            err.status = 500;
            next(err);
        })


})

//display new book creation form
router.get('/new', (req, res, next) => {
    res.render("books/new-book", { book: {}, title: "New Book", sectionTitle: "Create New Book" })
});

//Posts a new book to the database
router.post('/new', (req, res, next) => {
    Book.create(req.body)
        .then(book => {
            //redirect to books so User can easily see the changes performed 
            res.redirect('/books');
        })
        .catch(err => {
            // do it with validation err
            if (err.name === "SequelizeValidationError") {
                res.render("books/new-book", { book: Book.build(req.body), errors: err.errors, title: "New Book" })

            } else {
                err.status = 500;
                next(err);
            }
        })
        .catch(err => {
            err.status = 500;
            next(err);
        })
});

//display new book creation form
router.get('/search', (req, res, next) => {
    res.render("books/search-book", { book: {}, title: "Search Book", sectionTitle: "Search Book" })
});

//posts search parameters in the book form frame to result
router.post("/search", (req, res, next) => {
    //req body destructing
    const { title, author, genre, year } = req.body;

    //if none exists, it will demonstrate an error via re-submitting search book form with errors
    if (title || author || genre || year) {

        //build query string for /search-results path
        // to allow playing with search in paging & limitations via address bar in addition to UI form requests
        let qString = "";
        let hasParam = false;
        if (title) {
            qString += `title=${title}`;
            hasParam = true;
        }

        if (author) {
            if (!hasParam) {
                hasParam = true;

            } else {
                qString += '&';
            }
            qString += `author=${author}`;
        }

        if (genre) {
            if (!hasParam) {
                hasParam = true;

            } else {
                qString += '&';
            }
            qString += `genre=${genre}`;
        }

        if (year) {
            if (!hasParam) {
                hasParam = true;

            } else {
                qString += '&';
            }
            qString += `year=${year}`;
        }

        //including limit and paging initializers to allow pagination with url tampering
        res.redirect(`/books/search-result/1/3/verified?${qString}`);

    } else {
        let errorList = [];
        const customWarning = new Error("You should at least enter one parameter to start a search");
        errorList.push(customWarning)
        res.render("books/search-book", { book: {}, title: "Search Book", sectionTitle: "Search Book", errors: errorList })
    }
});

//display results with pagination
router.get("/search-result/:page/:limit/:result", (req, res, next) => {
    const { page, limit, result } = req.params
    const { title, author, genre, year } = req.query;

    let qString = "";
    let hasParam = false;
    if (title) {
        qString += `title=${title}`;
        hasParam = true;
    }

    if (author) {
        if (!hasParam) {
            hasParam = true;

        } else {
            qString += '&';
        }
        qString += `author=${author}`;

    }

    if (genre) {
        if (!hasParam) {
            hasParam = true;

        } else {
            qString += '&';
        }
        qString += `genre=${genre}`;
    }

    if (year) {
        if (!hasParam) {
            hasParam = true;

        } else {
            qString += '&';
        }
        qString += `year=${year}`;
    }

    let calcOffset = (page - 1) * limit;

    // building where clause for params in play
    let opArr = [];
    if(title) {
        opArr.push({
            title: {
                [Op.like]: '%' + title + '%'
            }
        })
    }

    if(author) {
        opArr.push({
            author: {
                [Op.like]: '%' + author + '%'
            }
        })
    }

    if(genre) {
        opArr.push({
            genre: {
                [Op.like]: '%' + genre + '%'
            }
        })
    }

    if(year) {
        opArr.push({
            year: {
                [Op.eq]: year
            }
        })
    }

    //original where clause to be built with like conditional
    let whereObjAdv = {
        [Op.and]: [...opArr]
    };

    //imagined result req param as a hashed code to be replaced in the url before redirected here
    //so I can confirm with a matching flow if search is allowed or not
    //thus in an authenticated sessions, users only have access can perform a search
    if (result === "verified") {
        Book.count({ where: whereObjAdv })
            .then(s => {
                const solidPages = Math.floor(s / limit);
                let pageCount = (s % limit > 0) ? solidPages + 1 : (s > 0) ? solidPages : solidPages + 1;
                Book.findAll({
                    where: whereObjAdv, offset: calcOffset, limit, order: [["createdAt", "DESC"]]
                })
                    .then(books => {
                        // `/books/search-result/1/3/verified?${qString}`);
                        res.render("books/search-result", { books, title: "Search Results", paging: { pageCount, active: Number(page), limit, query: qString } })
                    }).catch(err => {
                        err.status = 500;
                        next(err);
                    });

            })
            .catch(err => {
                err.status = 500;
                next(err);
            })

    } else {
        //just for case handling, curious to add something in the future.
        // will display simple 'Not allowed' text if you tamper 'verified?' to something else and then submit
        res.status(500).send("Not Allowed");
    }
})

//Shows book detail form
router.get('/:id', async (req, res, next) => {

    Book.findOne({ where: { id: req.params.id } }).then((book) => {
        if (book) {
            res.render("books/update-book", { book, title: book.title, sectionTitle: "Update Book" });
        } else {
            next(getCustomErr());
        }
    }).catch((err) => {
        err.status = 500;
        next(err);
    })
});

//Updates book info in the database 
router.post('/:id', (req, res, next) => {
    Book.findOne({ where: { id: req.params.id } })
        .then(book => {
            if (book) {
                //update it
                book.update(req.body);
            } else {
                next(getCustomErr());
            }
        })
        .then(() => {
            res.redirect("/books");
        })
        .catch(err => {
            err.status = 500;
            next(err);
        })
});


//Deletes a book
router.post('/:id/delete', (req, res, next) => {
    Book.findOne({ where: { id: req.params.id } })
        .then(book => {
            if (book) {
                //delete the book
                book.destroy();
            } else {

                next(getCustomErr());
            }
        })
        .then(() => {
            res.redirect("/books");
        })
        .catch(err => {
            err.status = 500;
            next(err);
        })
})


module.exports = router;