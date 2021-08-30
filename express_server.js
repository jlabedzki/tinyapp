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

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})

app.get('/urls', (req, res) => {
  const templateVariables = {urls: urlDatabase};
  res.render('urls_index', templateVariables);
})

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

