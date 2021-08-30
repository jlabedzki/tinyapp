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

const urlDatabase = {};



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
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

