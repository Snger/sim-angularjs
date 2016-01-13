/* jshint globalstrict: true, unused: false */
/* global Scope */

'use strict';

describe("[Angular-Scope]", function() {

  it("can be constructed and used as an object", function() {
    var scope = new Scope();
    scope.aProperty = 1;
    expect(scope.aProperty).toBe(1);
  });

  describe("$watch and $digest", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("calls the listener function of a watch on first $digest", function() {
      var watchFn    = function() { return 'wat'; };
      var listenerFn = jasmine.createSpy();
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(listenerFn).toHaveBeenCalled();
    });

    it("calls the watch function with the scope as the argument", function(){
      var watchFn = jasmine.createSpy();
      var listenerFn = function(){};
      scope.$watch(watchFn,listenerFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it("calls the listener function when the watched value changes", function(){
      scope.someValue = 'a';
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.someValue; },
        function(newValue, oldValue, scope){ scope.counter++; }
      );

      expect(scope.counter).toBe(0);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("calls listener when watch value is first undefined", function(){
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.someValue; },
        function(newValue, oldValue, scope){ scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("calls listener with new value as old value the first time", function(){
      scope.someValue = 123;
      var oldValueGiven;

      scope.$watch(
        function(scope){ return scope.someValue; },
        function(newValue, oldValue, scope){ oldValueGiven = oldValue; }
      );

      scope.$digest();
      expect(oldValueGiven).toBe(123);
    });

    it("may have watchers that omit the listener function", function(){
      var watchFn = jasmine.createSpy().and.returnValue('something');
      scope.$watch(watchFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    it("trigger chained watchers in the same $digest", function(){
      scope.name = "Sim";

      scope.$watch(
        function(scope){ return scope.nameUpper; },
        function(newValue, oldValue, scope){
          if (newValue) {
            scope.initial = newValue.substring(0, 1) + '.';
          }
        }
      );

      scope.$watch(
        function(scope){ return scope.name; },
        function(newValue, oldValue, scope){
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      scope.$digest();
      expect(scope.initial).toBe("S.");

      scope.name = "Jiason";
      scope.$digest();
      expect(scope.initial).toBe("J.");
    });

    it("gives up on the watchers after 10 iterations", function(){
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope){ return scope.counterA; },
        function(newValue, oldValue, scope){
          scope.counterB++;
        }
      );

      scope.$watch(
        function(scope){ return scope.counterB; },
        function(newValue, oldValue, scope){
          scope.counterA++;
        }
      );

      expect((function(){ scope.$digest();})).toThrow();
    });

    it("ends the digest when the last watch is clean", function(){
      scope.array = _.range(100);
      var watchExcutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope){
            watchExcutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope){}
        );
      });

      scope.$digest();
      expect(watchExcutions).toBe(200);

      scope.array[0] = 666;
      scope.$digest();
      expect(watchExcutions).toBe(301);
    });

    it("does not end digest so that new watchers are not run", function(){
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.$watch(
            function(scope){ return scope.aValue; },
            function(newValue, oldValue, scope){
              scope.counter++;
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("compares based on value if enabled", function(){
      scope.aValue = [0,1,2];
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(3);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("correctly handles NaN", function(){
      scope.number = 0/0; // NaN
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.number; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("allows destroying a $watch with a removal function", function(){
      scope.aValue = 'abc';
      scope.counter = 0;

      var destroyWatch = scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      
      scope.aValue = 'def';
      scope.$digest();
      expect(scope.counter).toBe(2);
      
      scope.aValue = 'ghi';
      destroyWatch();
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("allows destroying a $watch during digest", function(){
      scope.aValue = 'abc';
      var watchCalls = [];

      scope.$watch(
        function(scope){ 
          watchCalls.push('first');
          return scope.aValue;
        }
      );

      var destroyWatch = scope.$watch(
        function(scope){
          watchCalls.push("second");
          destroyWatch();
        }
      );

      scope.$watch(
        function(scope){ 
          watchCalls.push('third');
          return scope.aValue;
        }
      );

      scope.$digest();
      expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
    });

    it("allows a $watch to destroy another during digest", function(){
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope){
          return scope.aValue;
        },
        function(newValue, oldValue, scope){
          destroyWatch();
        }
      );
      var destroyWatch = scope.$watch(
        function(scope){ },
        function(newValue, oldValue, scope){ }
      );
      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

  });

  describe("$eval", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("executes $eval'ed function and return result", function(){
      scope.aValue = 26;

      var result = scope.$eval(function(scope){
        return scope.aValue;
      });

      expect(scope.aValue).toBe(26);
    });

    it("passes the second $eval argument straight through", function(){
      scope.aValue = 26;

      var result = scope.$eval(function(scope, arg){
        return scope.aValue + arg;
      }, 27);

      expect(result).toBe(53);
    });

  });

  describe("$apply", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("executes $apply'ed function and starts the digest", function(){
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(
        function(scope){
          scope.aValue = "someOtherValue";
        }
      );
      expect(scope.counter).toBe(2);
    });

  });

  describe("$evalAsync", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("executes $evalAsync'ed function later in the same cycle", function(){
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.$evalAsync(function(scope){
            scope.asyncEvaluated = true;
          });
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
      expect(scope.asyncEvaluatedImmediately).toBe(false);
    });

    it("executes $evalAsync'ed function added by watch function", function(){
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;

      scope.$watch(
        function(scope){
          if(!scope.asyncEvaluated){
            scope.$evalAsync(function(scope){
              scope.asyncEvaluated = true;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope){}
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
    });

    it("executes $evalAsync'ed function even when not dirty", function(){
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        function(scope){
          if(scope.asyncEvaluatedTimes < 2){
            scope.$evalAsync(function(scope){
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope){}
      );

      scope.$digest();
      expect(scope.asyncEvaluatedTimes).toBe(2);
    });

    it("eventually halts $evalAsync added by watchers", function(){
      scope.aValue = [1, 3, 4];

      scope.$watch(
        function(scope){
          scope.$evalAsync(function(scope){ });
          return scope.aValue;
        },
        function(newValue, oldValue, scope){}
      );

      expect(function(){scope.$digest();}).toThrow();
    });

  });

  describe("Scope Phases", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("has a $$phase field whose value is the current digest phase", function(){
      scope.aValue = "someValue";
      scope.phaseInWatchFunction = undefined;
      scope.phaseInListenerFunction = undefined;
      scope.phaseInApplyFunction = undefined;

      scope.$watch(
        function(scope){
          scope.phaseInWatchFunction = scope.$$phase;
          return scope.aValue;
        },
        function(newValue, oldValue, scope){
          scope.phaseInListenerFunction = scope.$$phase;
        }
      );

      scope.$apply(
        function(scope){
          scope.phaseInApplyFunction = scope.$$phase;
        }
      );
      expect(scope.phaseInWatchFunction).toBe('$digest');
      expect(scope.phaseInListenerFunction).toBe('$digest');
      expect(scope.phaseInApplyFunction).toBe('$apply');
    });

    it("schedules a digest in $evalAsync", function(done){
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$evalAsync(function(scope){});

      expect(scope.counter).toBe(0);
      setTimeout(function () {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

  });

  describe("$applyAsync", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("allows async $apply with $applyAsync", function(done){
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$applyAsync(
        function(scope){
          scope.aValue = "someOtherValue";
        }
      );
      expect(scope.counter).toBe(1);

      setTimeout(function(){
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it("never executes $applyAsync'ed function in the same cycle", function(done){
      scope.aValue = [1, 2, 3];
      scope.asyncApplied = false;

      scope.$watch(
        function(scope){ return scope.aValue; },
        function(newValue, oldValue, scope){
          scope.$applyAsync(function(scope){
            scope.asyncApplied = true;
          });
        }
      );

      scope.$digest();
      expect(scope.asyncApplied).toBe(false);
      setTimeout(function () {
        expect(scope.asyncApplied).toBe(true);
        done();
      }, 50);
    });

    it("coalesces many calls to $applyAsync", function(done){
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function (scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope){}
      );

      scope.$applyAsync(function(scope){
        scope.aValue = "otherValue";
      });
      scope.$applyAsync(function(scope){
        scope.aValue = "someOtherValue";
      });

      setTimeout(function () {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it("cancles and flushes $applyAsync if digest first", function(done){
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope){}
      );

      scope.$applyAsync(function(scope){
        scope.aValue = "otherValue";
      });
      scope.$applyAsync(function(scope){
        scope.aValue = "someOtherValue";
      });

      scope.$digest();
      expect(scope.counter).toBe(2);
      expect(scope.aValue).toBe("someOtherValue");

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

  });

  describe("$postDigest", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("runs a $postDigest function after each digest", function(){
      scope.counter = 0;

      scope.$$postDigest(function () {
        scope.counter++;
      });

      expect(scope.counter).toBe(0);

      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("does not include $$postDigest in the digest", function() {
      scope.aValue = "original value";

      scope.$$postDigest(function() {
        scope.aValue = "chagned value";
      });

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.watchedValue = newValue;
        }
      );

      scope.$digest();
      expect(scope.watchedValue).toBe("original value");
      scope.$digest();
      expect(scope.watchedValue).toBe("chagned value");
    });

  });

  describe("Handling Exceptions", function(){
    var scope;

    beforeEach(function(){
      scope = new Scope();
    });

    it("catches exception in watch function and continue", function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { throw "error"; },
        function(newValue, oldValue, scope) { }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("catches exception in listener function and continue", function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          throw "error";
        }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("catches exception in $evalAsync", function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$evalAsync(
        function(scope) {
          throw "error";
        }
      );

      setTimeout(function () {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it("catches exception in $applyAsync", function(done) {
      scope.$applyAsync(
        function(scope) {
          throw "error";
        }
      );
      scope.$applyAsync(
        function(scope) {
          throw "error";
        }
      );
      scope.$applyAsync(
        function(scope) {
          scope.applied = true;
        }
      );

      setTimeout(function () {
        expect(scope.applied).toBe(true);
        done();
      }, 50);
    });

    it("catches exception in $$postDigest", function() {
      var didRun = false;

      scope.$$postDigest(
        function(scope) {
          throw "error";
        }
      );
      scope.$$postDigest(
        function(scope) {
          didRun = true;
        }
      );
      
      scope.$digest();
      expect(didRun).toBe(true);
    });

  });
});
