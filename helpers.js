//Helper function used to get a userID by email
const getUserByEmail = (email, database) => {

  for (const profile in database) {
    if (database[profile].email === email) {
      return profile;
    }
  }

  return false;
}

const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

const redirectToLogin = (req, res, users) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect('/login');
  }
};

const checkUrlExistence = (shortURL, res, urlDatabase) => {
  if (!urlDatabase[shortURL]) {
    res.redirect(404, '/urls');
  }
};

const validateUserID = (shortURL, req, res, urlDatabase) => {
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, '/urls');
  }
};

const credentialValidator = (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.redirect(400, '/urls');
  }
};

const errorHandler = (statusCode) => {

  const errorMessages = {
    '404': `Oops! The page you're looking for could not be found.`,
    '403': `Sorry! You don't have permission to access that content.`,
  };

  app.get('/errors', (req, res) => {
    const templateVariables = {
      statusCode,
      errorMessage: errorMessages[statusCode],
      user: users[req.session.user_id]
    };
    res.render('errors', templateVariables);
  });
};

module.exports = { getUserByEmail, generateRandomString, redirectToLogin, checkUrlExistence, validateUserID, credentialValidator, errorHandler };