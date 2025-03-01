export const backendUrl =
  process.env.NODE_ENV === "production" ||
  process.env.REACT_APP_REMOTE === "true"
    ? `https://${process.env.REACT_APP_BACKEND}`
    : `${process.env.REACT_APP_DEV_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BACKEND_DEV_PORT}`;
