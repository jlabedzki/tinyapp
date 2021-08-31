//Helper function used to get a userID by email
const getUserByEmail = (email, database) => {

  for (const profile in database) {
    if (database[profile].email === email) {
      return profile;
    }
  }

  return false;
}

//Used to generate shortened URLs and userIDs
const generateRandomString = () => {
  return (Math.random() + 1).toString(36).substring(6);
};

module.exports = { getUserByEmail, generateRandomString };