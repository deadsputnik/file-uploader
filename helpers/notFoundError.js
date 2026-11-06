export function notFoundError(itemName) {
  const err = new Error(`${itemName} not found`);
  err.status = 404;
  return err;
}
