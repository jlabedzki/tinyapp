const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const timestamp = require('time-stamp');
const { getUserByEmail, generateRandomString, isLoggedIn, urlExistence, validateUserID, credentialInput, errorHandler } = require('./helpers');
const bcrypt = require('bcrypt');
const { users, urlDatabase } = require('./data');
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


app.get('/', (req, res) => {
  if (!isLoggedIn(req, users)) {
    return res.redirect('/login')
  }
  return res.redirect('/urls');
});


app.get('/urls', (req, res) => {
  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  return res.render('urls_index', templateVariables);
});


app.get('/urls/new', (req, res) => {
  if (!isLoggedIn(req, users)) {
    return res.redirect('/login')
  }

  const templateVariables = {
    user: users[req.session.user_id]
  };

  return res.render('urls_new', templateVariables);
});


app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlExistence(shortURL, urlDatabase)) {
    return errorHandler(404, res);
  }

  if (!validateUserID(shortURL, req, urlDatabase)) {
    return errorHandler(403, res);
  }

  const templateVariables = {
    shortURL,
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  return res.render('urls_show', templateVariables);
});



app.get('/register', (req, res) => {
  if (isLoggedIn(req, users)) {
    return res.redirect('/urls');
  }

  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  return res.render('register', templateVariables);
});


app.get('/login', (req, res) => {
  if (isLoggedIn(req, users)) {
    return res.redirect('/urls');
  }

  const templateVariables = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  return res.render('login', templateVariables);
});


app.post('/urls', (req, res) => {
  if (!isLoggedIn(req, users)) {
    return res.redirect('/login')
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    visits: [],
    uniqueVisits: 0,
    visitsByCreator: 0
  };

  //urls_show page
  return res.redirect(`/urls/${shortURL}`);
});


app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlExistence(shortURL, urlDatabase)) {
    return res.status(404).send('Sorry, we cannot find that!');
  }

  //Assign a link
  const longURL = urlDatabase[shortURL].longURL;

  const visitorID = req.session.user_id || 'anonymous';
  const date = timestamp('YYYY/MM/DD');
  const time = timestamp('HH:mm:ss');
  const visitorInfo = `(Visitor ID: ${visitorID}) Visited on ${date} at ${time}`;

  //Increment visits. Add the user to unique visitors only once.
  if (urlDatabase[shortURL].visitsByCreator === 0) {
    urlDatabase[shortURL].visits.push(visitorInfo);
    urlDatabase[shortURL].uniqueVisits += 1;
    urlDatabase[shortURL].visitsByCreator += 1;
  } else {
    urlDatabase[shortURL].visits.push(visitorInfo);
  }

  if (req.session.isNew) {
    urlDatabase[shortURL].uniqueVisits += 1;
  }

  return res.redirect(longURL);
});


app.delete('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlExistence(shortURL, urlDatabase)) {
    return errorHandler(404, res);
  }

  if (!validateUserID(shortURL, req, urlDatabase)) {
    return errorHandler(403, res);
  }

  delete urlDatabase[shortURL];
  return res.redirect('/urls');
});


app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlExistence(shortURL, urlDatabase)) {
    return errorHandler(404, res);
  }

  if (!validateUserID(shortURL, req, urlDatabase)) {
    return errorHandler(403, res);
  }

  //Reassign shortURL
  urlDatabase[shortURL].longURL = req.body.longURL;
  return res.redirect('/urls');
});


app.post('/register', (req, res) => {
  if (!credentialInput(req)) {
    return errorHandler(400, res);
  }

  const user = getUserByEmail(req.body.email, users);

  if (user) {
    //Email already exists in database?
    return errorHandler(400, res);
  }

  const randomUserID = generateRandomString();
  const hashedPass = bcrypt.hashSync(req.body.password, 10);

  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: hashedPass
  };

  //Assign cookie
  req.session.user_id = randomUserID;
  return res.redirect('/urls');
});


app.post('/login', (req, res) => {

  if (!credentialInput(req)) {
    return errorHandler(400, res);
  }

  //Initialize an email and password match as false, and an undefined userID
  let emailMatch = false;
  let passwordMatch = false;
  let randomUserID;

  const user = getUserByEmail(req.body.email, users);

  if (user) {
    emailMatch = true;

    //Comparing passwords with bcrypt
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      passwordMatch = true;
      randomUserID = user;
    }
  }

  if (emailMatch === true && passwordMatch === true) {
    //Assign cookie
    req.session.user_id = randomUserID;
    return res.redirect('/urls');
  }

  //Invalid credentials
  return errorHandler(403, res);
});


app.post('/logout', (req, res) => {
  //clear cookies
  req.session = null;
  return res.redirect('/login');
});


app.use((req, res, next) => {
  //Nonexistent page
  return res.status(404).redirect('/urls');
})


app.listen(PORT);