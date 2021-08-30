const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

const string = generateRandomString();
console.log(string);

const urlDatabase = {
  'b2xBn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};



app.get('/urls', (req, res) => {
  const templateVariables = {urls: urlDatabase};
  res.render('urls_index', templateVariables);
});


app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});


app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const templateVariables = {
    shortURL,
    longURL: urlDatabase[shortURL]
  }
  res.render('urls_show', templateVariables);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send(req.body);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

