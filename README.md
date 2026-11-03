# Getting Started with Create React App

## Configure the API server

The React app sends requests to an API server. The server connects to MongoDB; the browser must never receive your MongoDB Atlas connection string or database password.

Copy `.env.example` to `.env.local` and set `REACT_APP_API_URL` to your API server URL. The default is `http://localhost:5000` for local development. Restart `npm start` after changing this value.

To use MongoDB Atlas, configure the **backend** with the Atlas connection string (for example, in the backend's server-side `MONGODB_URI` environment variable), and set the Atlas database name there. Add the backend server's network/IP access and database user in Atlas. This repository contains only the React frontend, so the backend must be updated and deployed separately.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# ExpenseTracker-frontend

## Deploy with GitHub and Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import this GitHub repository.
   Keep the Create React App build command (`npm run build`) and output
   directory (`build`).
3. If you use a different backend, set `REACT_APP_API_URL` in Vercel's
   **Settings → Environment Variables** to its public HTTPS URL (without a
   trailing slash), then redeploy. The checked-in `.env.production` is the
   default for this deployment.
4. Configure the backend's CORS allowlist to include your Vercel domain.

This repository contains only the frontend. The backend must be deployed
separately, and `vercel.json` ensures that refreshing React routes such as
`/dashboard` serves the app. It does not host or proxy the backend API.

For local development, set `REACT_APP_API_URL=http://localhost:5000` in
`.env.local`. Keep MongoDB Atlas credentials in the backend's server-side
`MONGODB_URI` environment variable, never in the frontend.
