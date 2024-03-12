function getBackendUrl() {
  if (typeof window === "undefined") {
    return "/";
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port =
    process.env.NODE_ENV === "development" ? 8000 : window.location.port;
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}

export { getBackendUrl };
