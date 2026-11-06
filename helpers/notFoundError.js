export function notFoundError(itemName) {
  console.log("not Found Error");
  const err = new Error(`${itemName} not found`);
  err.status = 404;
  return err;
}
