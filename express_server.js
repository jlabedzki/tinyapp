const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xBn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.use(morgan('dev'));


app.get('/urls', (req, res) => {
  const templateVariables = {urls: urlDatabase};
  res.render('urls_index', templateVariables);
})

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const templateVariables = {
    shortURL,
    longURL: urlDatabase[shortURL]
  }
  res.render('urls_show', templateVariables);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

