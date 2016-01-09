/* jshint globalstrict: true */

'use strict';

function Scope () {
  this.$$watchers = [];
}

/* use for initialize the last attribute to be unique
  -- javascript function is reference value.
 */
function initWatchVal() {}

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn,
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function() {
	var self = this;
  var newValue,oldValue;

  _.forEach(this.$$watchers, function(watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (newValue !== oldValue) {
      watcher.last = newValue;
      watcher.listenerFn(newValue,
        (oldValue === initWatchVal ? newValue : oldValue),
        self);
    }
  });
};
