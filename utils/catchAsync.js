module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //Solution to ErrorHandling when removing try{}, catch{} blocks
  };
};
