const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString } = require('./helpers');
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


//Placeholder for our url data
const urlDatabase = {};

//Placeholder for user profiles (id, email, password(hashed))
const users = {};


//Redirect to url_index page or login page based on whether or not the user is logged in.
app.get('/', (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect('/login');
  }
  res.redirect('/urls');
})


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
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.render('register');
});



//Login template
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
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
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    res.redirect(400, 'back');
  }

  const randomUserID = generateRandomString();
  const hashedPass = bcrypt.hashSync(req.body.password, 10);

  //Generating a user profile with a hashed password using bcrypt
  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: hashedPass
  };

  req.session.user_id = randomUserID;
  res.redirect('/urls');
});



//Login form
app.post('/login', (req, res) => {

  //If the user doesn't fill either the email or password form, then we give a 400 statuscode
  if (!req.body.email || !req.body.password) {
    res.redirect(400, 'back');
  }

  //Initialize an email and password match as false, and an undefined userID
  let emailMatch = false;
  let passwordMatch = false;
  let randomUserID;

  //If the email provided matches an email in the users object, then we set email match to true and then check the password
  //If the password matches, then we set the randomUserId to the id of the user profile that matched
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    emailMatch = true;

    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      passwordMatch = true;
      randomUserID = user;
    }
  }


  //If both email and password match, then we set the cookie user_id to match the randomUserID, encrypted using cookie-sessions. If there's no match then we give a 403 statuscode
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

