const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//Used to generate shortened URLs and userIDs
const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

//Placeholder for our url data
const urlDatabase = {};

//Placeholder for user profiles (id, email, password(hashed))
const users = {};


//URL index template
app.get('/urls', (req, res) => {

  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVariables);
});



//New URL template
app.get('/urls/new', (req, res) => {
  const templateVariables = {
    user: users[req.session.user_id]
  }

  if (users[req.session.user_id] === undefined) {
    console.log('Must be logged in');
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVariables);
  }
});



//Show URLs template
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  //If the short URL doesn't exist, then we give a 404 statuscode
  //If the user tries to view a URL that they didn't create, then we give a 403 status code
  if (!urlDatabase[shortURL]) {
    res.redirect(404, '/urls');
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, '/urls');
  } else {
    const templateVariables = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: users[req.session.user_id]
    }

    res.render('urls_show', templateVariables);
  }
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

  //If the user is not logged in, redirect them to login page before creating a shortened URL

  //Once the user is logged in, we add the short URL to our urldatabase object as a key, with a object value containing the respective long URL as well as the ID of the user that created the short URL
  if (users[req.session.user_id] === undefined) {
    res.redirect('/login');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    }

    res.redirect(`/urls/${shortURL}`);
  }
});



//Redirect to the original URL that client provided when creating shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  //If the url doesn't exist in the urldatabase, then we give a 404 statuscode
  if (!urlDatabase[shortURL]) {
    res.status(404).send('Sorry, we cannot find that!')
  }

  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});



//Delete a shortURL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  //If the shortURl doesn't exist, then we give a 404 statuscode
  //If the user is trying to delete a shortURL that they didn't create, then we give a 403 statuscode
  if (!urlDatabase[shortURL]) {
    res.redirect(404, 'back');
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, 'back');
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});



//Edit a shortURL to link to a different longURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  //If the shortURL is not found, then we give a 404 statuscode
  //If the user is trying to edit a shortURL that they didn't create, then we give a 403 status code
  if (!urlDatabase[shortURL]) {
    res.redirect(404, 'back');
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, 'back');
  } else {

    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});



//Generate user profile and track the user id with a cookie.
app.post('/register', (req, res) => {

  //If the user doesn't fill out either the email or password forms, then we give a 400 statuscode
  if (!req.body.email || !req.body.password) {
    res.redirect(400, 'back');
  }

  //If the email entered matches an existing account's email address, then we give a 400 status code
  for (const profiles in users) {
    if (users[profiles].email === req.body.email) {
      res.redirect(400, 'back');
    }
  }

  const randomUserID = generateRandomString();
  const hashedPass = bcrypt.hashSync(req.body.password, 10);

  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: hashedPass
  };

  req.session.user_id = randomUserID;
  res.redirect('/urls');
});



//Check to see if the email address and password entered in login match a profile in the users object. If so, set the cookie to the ID of the user and redirect to /urls page. If not, throw error, statuscode 403.
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.redirect(400, 'back');
  }

  let emailMatch = false;
  let passwordMatch = false;
  let randomUserID;

  for (const profiles in users) {
    if (users[profiles].email === req.body.email) {
      emailMatch = true;
      if (bcrypt.compareSync(req.body.password, users[profiles].password)) {
        passwordMatch = true;
        randomUserID = users[profiles].id;
      }
    }
  }

  if (emailMatch === true && passwordMatch === true) {
    req.session.user_id = randomUserID;
    res.redirect('/urls');
  } else {
    res.redirect(403, 'back');
  }
});



//Redirect to login page after logout and clear cookie user_id
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

