# sql_library_manager-v1
Library Manager Demo App: Dynamic website using JavaScript, Node.js, Express, Pug, and the SQL ORM Sequelize

# Design Notes
- Neither Express Generator nor Seqelize CLI is used
- Includes library.db: a simple Sqlite DB stores book records
- Dependencies: 
    * sequelize
    * sqlite3
    * express
    * pug
    * body-parser
- use npm install to install the dependencies
- use npm start to start express server - with nodemon

#Extras
- Has 'Search' functionality with necessary routes: posting search params and displaying search results
  - Depending on the following Book model fields, you can use one or more fields to make advanced search executions:
    * Title
    * Author
    * Genre
    * Year
  - serch actions are performed case insensitively by default with [Op.like] option for all string fields (only year is numeric)
- Has 'Pagination' functionality for both index route book listing and search result book listing
  - For index route book listing, functionality has 5 limit option (displays 5 records per page) - Due to the route handling design, limit option can not be tampered via adress bar
  - For search result listing, functionlity has default 3 limit option (displays 3 records for found book results listing). Due to the design, paging and limit actions can be tampered 
  using address bar. Thus, you can review more without having UI actions for the found book results
  
