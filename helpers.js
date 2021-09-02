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

const isLoggedIn = (req, users) => {
  if (users[req.session.user_id] === undefined) {
    return false;
  }
  return true;
};

const urlExistence = (shortURL, urlDatabase) => {
  if (!urlDatabase[shortURL]) {
    return false;
  }
  return true;
};

const validateUserID = (shortURL, req, urlDatabase) => {
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return false;
  }
  return true;
};

const credentialInput = (req) => {
  if (!req.body.email || !req.body.password) {
    return false;
  }
  return true;
};

const errorHandler = (statusCode, res) => {
  const errorMessages = {
    '404': `Error 404: Not found.`,
    '403': `Error 403: Forbidden.`,
    '400': `Error 400: Invalid email or password. If you're trying to register, you may have entered an email that's already in our database.`
  };

  const templateVariables = {
    statusCode,
    errorMessage: errorMessages[statusCode],
  };

  res.render('errors', templateVariables);
};

module.exports = { getUserByEmail, generateRandomString, isLoggedIn, urlExistence, validateUserID, credentialInput, errorHandler };