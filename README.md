# Social Media Express Application
[![Node.js CI](https://github.com/DeepEdu/social-media-platform/actions/workflows/test-apis.yml/badge.svg?branch=main)](https://github.com/DeepEdu/social-media-platform/actions/workflows/test-apis.yml)

This project is a NodeJS application that provides APIs for a social media platform. The APIs support features such as getting a user profile, following a user, uploading a post, deleting a post, liking a post, unliking a post, and commenting on a post. The application is built using ExpressJS and MongoDB.

**Currently deployed at** https://social-media-platform-backend.onrender.com

### Requirements

To run this application, you need to have the following software installed on your system:

- Node.js
- MongoDB

### Installation

Clone this repository to your local machine using the following command:

```sh
git clone https://github.com/DeepEdu/social-media-platform.git
```

Change into the project directory:

```sh
cd social-media-platform
```

## Running the App

Run the app by installing dependencies:

```sh
npm install
```

And then executing the start command:

```sh
npm start
```

Backend service will be deployed at http://localhost:8080

## Running via Docker

Build docker image with command:

```shell
docker build -t social-media-platform-image:latest .
```

Run docker container with above built image with command:

```sh
docker run -p 8080:8080 --name social-media-platform social-media-platform-image:latest
```

## Testing the App

Run the app by installing dependencies:

```sh
npm install
```

And then executing the test command:

```sh
npm test
```

this will run and verify all the testcases.

### Test Cases

All test cases are listed in [./test/README.md](./test/README.md)

PostMan Collection can be found [here](https://www.postman.com/payload-astronomer-70816502/workspace/deepika-s-workspace/collection/27002600-a6b3b913-8fb3-4e30-b1e1-e42f3f5fac1c?action=share&creator=27002600).
