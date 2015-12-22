/* jshint globalstrict: true */
/* global Scope: false */

'use strict';

describe("[Angular-Scope]", function() {

  it("can be constructed and used as an object", function() {
    var scope = new Scope();
    scope.aProperty = 1;
    expect(scope.aProperty).toBe(1);
  });

  describe("digest", function(){
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
          };
        }
      );

      scope.$watch(
        function(scope){ return scope.name; },
        function(newValue, oldValue, scope){
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          };
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
          )
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
});
