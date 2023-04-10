export const backendUrl =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.REACT_APP_BACKEND}`
    : `http://${window.location.hostname}:${process.env.REACT_APP_BACKEND_DEV_PORT}`;
