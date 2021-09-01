const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const timestamp = require('time-stamp');
const { getUserByEmail, generateRandomString, redirectToLogin, urlExistence, validateUserID, credentialValidator, errorHandler } = require('./helpers');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//Placeholder for our url data
const urlDatabase = {};

//Placeholder for user profiles (id, email, password(hashed))
const users = {};

//Placeholder for url analytics
const analytics = {};


//Redirect to url_index page or login page based on whether or not the user is logged in.
app.get('/', (req, res) => {

  //If user isn't logged in, use helper function to redirect to login page
  redirectToLogin(req, res, users);

  res.redirect('/urls');
});


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
  };

  //If user isn't logged in, use helper function to redirect to login page
  redirectToLogin(req, res, users);

  res.render('urls_new', templateVariables);
});



//Show URLs template
app.get('/urls/:shortURL', (req, res) => {

  const shortURL = req.params.shortURL;

  //If the short URL doesn't exist, then we give a 404 statuscode
  if (!urlDatabase[shortURL]) {
    errorHandler(404, req, res, users);
  }

  //If the user tries to view a URL that they didn't create, then we give a 403 status code
  if (!validateUserID(shortURL, req, res, urlDatabase)) {
    errorHandler(403, req, res, users);
  }

  const templateVariables = {
    shortURL,
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  res.render('urls_show', templateVariables);
});



//Register template
app.get('/register', (req, res) => {

  //If user is logged in, redirect them to the /urls page
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  res.render('register', templateVariables);
});



//Login template
app.get('/login', (req, res) => {

  if (req.session.user_id) {
    res.redirect('/urls');
  }

  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  res.render('login', templateVariables);
});



//Generate a shortURL, add it to our url database, and then redirect to url_shows.ejs
app.post('/urls', (req, res) => {

  //If the user is not logged in, redirect them to login page before creating a shortened URL
  redirectToLogin(req, res, users);

  //Once the user is logged in, we add the short URL to our urldatabase object as a key with an object value containing the respective long URL as well as the ID of the user that created the short URL
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    visits: [],
    uniqueVisits: 0,
    visitsByCreator: 0
  };

  res.redirect(`/urls/${shortURL}`);
});



//Allow shortURLs to link back to the original link that the user provided
app.get('/u/:shortURL', (req, res) => {

  const shortURL = req.params.shortURL;

  //If the url doesn't exist in the urldatabase, then we give a 404 statuscode
  if (!urlExistence(shortURL, urlDatabase)) {
    res.status(404).send('Sorry, we cannot find that!');
  }

  //Assign a link
  const longURL = urlDatabase[shortURL].longURL;

  //Create visitor info
  const visitorID = req.session.user_id || 'anonymous';
  const date = timestamp('YYYY/MM/DD');
  const time = timestamp('HH:mm:ss');
  const visitorInfo = `(Visitor ID: ${visitorID}) Visited on ${date} at ${time}`;

  //Increment total visits. Add the user to unique visitors only once.
  if (urlDatabase[shortURL].visitsByCreator === 0) {
    urlDatabase[shortURL].visits.push(visitorInfo);
    urlDatabase[shortURL].uniqueVisits += 1;
    urlDatabase[shortURL].visitsByCreator += 1;
  } else {
    urlDatabase[shortURL].visits.push(visitorInfo);
  }


  //Increment unique visits if the cookie session is new
  if (req.session.isNew) {
    urlDatabase[shortURL].uniqueVisits += 1;
  }

  res.redirect(longURL);
});



//Delete a shortURL
app.delete('/urls/:shortURL/delete', (req, res) => {

  const shortURL = req.params.shortURL;

  //If the shortURl doesn't exist, then we give a 404 statuscode
  if (!urlExistence(shortURL, urlDatabase)) {
    errorHandler(404, req, res, users);
  }

  //If the user is trying to delete a shortURL that they didn't create, then we give a 403 statuscode
  if (!validateUserID(shortURL, req, res, urlDatabase)) {
    errorHandler(403, req, res, users);
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


//Edit a shortURL to link to a different longURL
app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  //If the shortURL is not found, then we give a 404 statuscode
  if (!urlExistence(shortURL, urlDatabase)) {
    errorHandler(404, req, res, users);
  }

  //If the user is trying to edit a shortURL that they didn't create, then we give a 403 status code
  if (!validateUserID(shortURL, req, res, urlDatabase)) {
    errorHandler(403, req, res, users);
  }

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});



//Generate user profile and track the user id with a cookie.
app.post('/register', (req, res) => {

  //If the user doesn't fill out either the email or password forms, then we give a 400 statuscode
  if (!credentialValidator(req, res)) {
    errorHandler(400, req, res, users);
  }

  //Use helper function to find a userID by email
  const user = getUserByEmail(req.body.email, users);

  //If the email entered matches an existing account's email address, then we give a 400 status code
  if (user) {
    errorHandler(400, req, res, users);
  }

  const randomUserID = generateRandomString();
  const hashedPass = bcrypt.hashSync(req.body.password, 10);

  //Generating a user profile with a hashed password using bcrypt
  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: hashedPass
  };

  //Assign cookie
  req.session.user_id = randomUserID;
  res.redirect('/urls');
});



//Login form
app.post('/login', (req, res) => {

  //If the user doesn't fill either the email or password form, then we give a 400 statuscode
  if (!credentialValidator(req, res)) {
    errorHandler(400, req, res, users);
  }


  //Initialize an email and password match as false, and an undefined userID
  let emailMatch = false;
  let passwordMatch = false;
  let randomUserID;

  //Use helper function to find a userID based on email
  const user = getUserByEmail(req.body.email, users);

  //If the email provided matches an email in the users database, then we set email match to true and then check the password
  if (user) {
    emailMatch = true;

    //If the password matches, then we set the randomUserId to the id of the user profile that matched
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      passwordMatch = true;
      randomUserID = user;
    }
  }

  //If both email and password match, then we set the cookie user_id to match the randomUserID, encrypted using cookie-sessions. If there's no match then we give a 403 statuscode
  if (emailMatch === true && passwordMatch === true) {
    req.session.user_id = randomUserID;
    res.redirect('/urls');
  }

  //If the password and email do not match to a user in the database, then we give a 403 status code
  errorHandler(403, req, res, users);
});



//Redirect to login page after logout and clear cookie user_id
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.use((req, res, next) => {
  res.status(404).redirect('/urls');
})

app.use((req, res, next) => {
  res.status(403).send('Forbidden!');
});

app.listen(PORT);

