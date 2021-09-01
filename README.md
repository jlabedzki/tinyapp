# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Purpose

BEWARE: This project was built for learning purposes. It is not intended for use in production-grade software.

This project was created and published by me as part of my learnings at Lighthouse Labs.

## Final Product

Register page
!["Register page"](/screenshots/1.png)

New URL page
!["New URL page"](/screenshots/2.png)

Home page
!["Home page"](/screenshots/3.png)

Edit URL page
!["Edit URL page"](/screenshots/4.png)

Error page
!["Error page"](/screenshots/5.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override
- time-stamp

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Head to http://localhost:8080/register to get started!

## Features

- Users can:
  - create a unique account
  - generate a shortened URL linked to a long URL
  - update the shortened URL to link to a new long URL
  - delete shortened URLs
- URLs:
  - redirect to the respective long URL regardless of whether the link follower is logged in or not
- Analytics:
  - when clicking on the "Edit" button on the homepage, each URL will display:
    - the total amount of times the URL has been visited
    - the number of unique visitors
    - a message log of visitor info:
      - visitor ID
      - date and time that link was followed
- Security:
  - all passwords are hashed
  - cookies are encrypted
  - users can only edit or delete short URLs that they themselves created