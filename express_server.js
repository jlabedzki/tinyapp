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

const users = {};

//URL index template
app.get('/urls', (req, res) => {
  const templateVariables = {
    urls: urlDatabase,
    user: {
      id: req.cookies['user_id'],
      email: users[req.cookies['user_id']].email,
      password: users[req.cookies['user_id']].password
    }
  };
  res.render('urls_index', templateVariables);
});

//New URL template
app.get('/urls/new', (req, res) => {
  const templateVariables = {
    user: {
      id: req.cookies['user_id'],
      email: users[req.cookies['user_id']].email,
      password: users[req.cookies['user_id']].password
    }
  }

  res.render('urls_new', templateVariables);
});

//Show URLs template
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const templateVariables = {
    shortURL,
    longURL: urlDatabase[shortURL],
    user: {
      id: req.cookies['user_id'],
      email: users[req.cookies['user_id']].email,
      password: users[req.cookies['user_id']].password
    }
  }
  res.render('urls_show', templateVariables);
});

//Register template
app.get('/register', (req, res) => {
  res.render('register');
});

//Generate a shortURL, add it to our url database, and then redirect to url_shows.ejs
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/${shortURL}`);
});

//Redirect to the original URL that client provided when creating shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

//Delete a shortURL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//Edit a shortURL to link to a different longURL
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

// //Track username after login submission via cookie
// app.post('/login', (req, res) => {
//   const username = req.body.username;
//   res.cookie('username', username);
//   res.redirect('/urls');
// });

//Clear cookie after logout
app.post('/logout', (req, res) => {
  const username = Object.keys(req.cookies['user_id']);
  console.log(username);
  
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//Generate user profile and track the user id with a cookie.
app.post('/register', (req, res) => {
  const randomUserID = generateRandomString();

  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: req.body.password
  };

  console.log(users);

  res.cookie('user_id', randomUserID);
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

