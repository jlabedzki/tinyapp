
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

const urlExistence = (shortURL, urlDatabase) => {
  if (!urlDatabase[shortURL]) {
    return false;
  }

  return true;
};

const validateUserID = (shortURL, req, res, urlDatabase) => {
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    // res.redirect(403, '/urls');
    return false;
  }

  return true;
};

const credentialValidator = (req, res) => {

  if (!req.body.email || !req.body.password) {
    return false;
  }

  return true;
};

const errorHandler = (statusCode, req, res, users) => {

  const errorMessages = {
    '404': `Error 404: Not found.`,
    '403': `Error 403: Forbidden.`,
    '400': `Error 400: Bad request.`
  };

  const templateVariables = {
    statusCode,
    errorMessage: errorMessages[statusCode],
    user: users[req.session.user_id]
  };

  res.render('errors', templateVariables);
};

module.exports = { getUserByEmail, generateRandomString, redirectToLogin, urlExistence, validateUserID, credentialValidator, errorHandler };