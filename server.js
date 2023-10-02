const express = require('express');
const bodyParser = require('body-parser'); 
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream'); 


// create express app
const app = express();

// parse the req body
// configure body-parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 
 
// create a write stream for the log file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
 
// create a custom stream that writes to both the file and the console
const stream = new PassThrough();
stream.on('data', (chunk) => {
  console.log(chunk.toString());
  accessLogStream.write(chunk);
});

// create a custom log format function
const logFormat = (tokens, req, res) => {
  return JSON.stringify({
    'date': tokens.date(req, res, 'iso'),
    'method': tokens.method(req, res),
    'url': tokens.url(req, res),
    'status': tokens.status(req, res),
    'response-time': tokens['response-time'](req, res),
    'request-body': JSON.stringify(req.body),
    'response-body': JSON.stringify(res.locals.data)
  });
};

// setup the logger middleware
app.use(morgan(logFormat, { stream }));

// setup the response body logger middleware
app.use((req, res, next) => {
  const originalJson = res.json; 
  res.json = function (body) {
    originalJson.call(this, body);
    res.locals.data = body;
  }; 
  next();
});

   
// Setup server port
const port = process.env.PORT || 8989;

 
// parse requests of content-type - application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
  
// Require routes  
const excelImportRoute = require('./src/routes/excelImport.routes');
const dsrRoutes = require('./src/routes/dsruser.routes');
const reatilerRoutes = require('./src/routes/retailers.routes');
const masterRoutes = require('./src/routes/masters.routes'); 
const sfRoutes = require('./src/routes/sf_import.routes'); 
const sfDataImport = require('./src/routes/sf_import.routes'); 
 
// using as middleware  
app.use('/uploadExcel/', excelImportRoute);
app.use('/dsr/', dsrRoutes);
app.use('/dsr/retailer/',reatilerRoutes);
app.use('/dsr/masters/',masterRoutes);
app.use('/sf/upload/',sfRoutes);  
app.use('/sf/sync/',sfDataImport);

// listen for requests
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});