const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

const urlDatabase = {
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
  // for (const profiles in users) {
  //   if (profiles !== req.cookies.user_id) {
  //     res.redirect('/login');
  //   }
  // }
  console.log(req.cookies.user_id);
  const templateVariables = {
    user: {
      id: req.cookies['user_id'],
      email: users[req.cookies['user_id']].email,
      password: users[req.cookies['user_id']].password
    }
  }

  if (users[req.cookies.user_id] === undefined) {
    console.log('Must be logged in');
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVariables);
  }
});



//Show URLs template
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const templateVariables = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    urlID: urlDatabase[shortURL].userID,
    user: {
      id: req.cookies['user_id'],
      email: users[req.cookies['user_id']].email,
      password: users[req.cookies['user_id']].password
    }
  }

  // if (user.id !== urlDatabase[shortURL].userID) {}

  res.render('urls_show', templateVariables);

});



//Register template
app.get('/register', (req, res) => {
  res.render('register');
});



//Login template
app.get('/login', (req, res) => {
  res.render('login');
});



//Generate a shortURL, add it to our url database, and then redirect to url_shows.ejs
app.post('/urls', (req, res) => {
  if (users[req.cookies.user_id] === undefined) {
    console.log('Must be logged in');
    res.redirect('/login');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id
    }
    res.redirect(`/urls/${shortURL}`);
  }
});



//Redirect to the original URL that client provided when creating shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  const longURL = urlDatabase[shortURL].longURL;

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

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});



//Generate user profile and track the user id with a cookie.
app.post('/register', (req, res) => {

  if (!req.body.email || !req.body.password) {
    throw Error('Statuscode 400: Bad Request\nPlease enter a valid email address and password.')
  }

  for (const profiles in users) {
    if (users[profiles].email === req.body.email) {
      throw Error('Statuscode 400: Bad Request\nThat account already exists');
    }
  }

  const randomUserID = generateRandomString();

  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: req.body.password,
  };

  res.cookie('user_id', randomUserID);
  res.redirect('/urls');
});



//Check to see if the email address and password entered in login match a profile in the users object. If so, set the cookie to the ID of the user and redirect to /urls page. If not, throw error, statuscode 403.
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    throw Error('Statuscode 400: Bad Request\nPlease enter a valid email address and password.')
  }

  let emailMatch = false;
  let passwordMatch = false;
  let randomUserID;

  for (const profiles in users) {
    if (users[profiles].email === req.body.email) {
      emailMatch = true;
      if (users[profiles].password === req.body.password) {
        passwordMatch = true;
        randomUserID = users[profiles].id;
      }
    }
  }

  if (emailMatch === true && passwordMatch === true) {
    res.cookie('user_id', randomUserID);
    res.redirect('/urls');
  } else {
    throw Error('Statuscode 403: Forbidden\nEmail or password does not match');
  }
});



//Redirect to login page after logout and clear cookie user_id
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

