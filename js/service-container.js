goog.provide('ian.ServiceContainer');

goog.require('goog.array');


/**
 * @constructor
 */
ian.ServiceContainer = function () {
  this.factories_ = {};
  this.instances_ = {};
};


/**
 * @param {string} key The key of the service being added.
 * @param {Function} factory A factory or a constructor of the service being
 *   added.
 */
ian.ServiceContainer.prototype.add = function (key, factory) {
  if (this.instances_[key]) {
    delete this.instances_[key];
  }

  this.factories_[key] = factory;
};


/**
 * @param {string} key A key of a service.
 * @return {!Object} An instance of the requested service.
 */
ian.ServiceContainer.prototype.get = function (key) {
  var instance = this.instances_[key];
  if (!instance) {
    var Factory = this.factories_[key];
    if (!Factory) {
      throw new Error('No factory for the service "' + key + '"');
    }

    instance = this.create(Factory);
    if (!goog.isDef(instance)) {
      throw new Error('Service "' + key + '" could not be created.');
    }
    this.instances_[key] = instance;
  }

  return instance;
};


/**
 * @param {!Array.<string>} keys Keys of the service to return.
 * @return {!Array.<!Object>} Instances of the requested services.
 */
ian.ServiceContainer.prototype.getAll = function (keys) {
  return goog.array.map(keys, function (key) {
    return this.get(key);
  }, this);
};


/**
 * @param {Function} Constructor A constructor.
 * @param {...*} var_args Any arguments to append to the argument list
 *   of the constructor call after the service instances of its
 *   dependencies.
 */
ian.ServiceContainer.prototype.create = function (Constructor, var_args) {
  var keys = Constructor.prototype.$deps || [];
  var services = this.getAll(keys);
  var args = services.concat(Array.prototype.slice.call(arguments, 1));

  var Instantiator = function () {};
  Instantiator.prototype = Constructor.prototype;

  var instance = new Instantiator();
  var result = Constructor.apply(instance, args);

  return goog.isDef(result) ? result : instance;
};