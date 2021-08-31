const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

const urlDatabase = {
  '923sdf': "http://www.lighthouselabs.ca"
};


//URL index template
app.get('/urls', (req, res) => {
  const templateVariables = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('urls_index', templateVariables);
});

//New URL template
app.get('/urls/new', (req, res) => {
  const templateVariables = {
    username: req.cookies['username']
  }

  res.render('urls_new', templateVariables);
});

//Show URLs template
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const templateVariables = {
    shortURL,
    longURL: urlDatabase[shortURL],
    username: req.cookies["username"]
  }
  res.render('urls_show', templateVariables);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  let shortURL;
  for (const short in urlDatabase) {
    if (short === req.params.shortURL) {
      shortURL = short;
    }
  }

  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

