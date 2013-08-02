var exp = module.exports;

exp.invokeCallback = function(cb) {
  if(typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};
