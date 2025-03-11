/**
 * Simple Counter Example
 * This file demonstrates a basic counter function
 * It's designed to be easily modifiable by Cursor's YOLO mode
 */

// SECTION: Counter Function
function counter(start = 0, min = null, max = null) {
  let count = start;
  const initialValue = start;
  
  return {
    increment: (step = 1) => {
      count += step;
      if (max !== null && count > max) count = max;
      return count;
    },
    decrement: (step = 1) => {
      count -= step;
      if (min !== null && count < min) count = min;
      return count;
    },
    multiply: (factor = 1) => {
      count = count * factor;
      if (min !== null && count < min) count = min;
      if (max !== null && count > max) count = max;
      return count;
    },
    reset: () => {
      count = initialValue;
      return count;
    },
    setValue: (newValue) => {
      if (min !== null && newValue < min) newValue = min;
      if (max !== null && newValue > max) newValue = max;
      count = newValue;
      return count;
    },
    getValue: () => count
  };
}

// SECTION: Test the counter
function testCounter() {
  console.log("Testing counter functionality...");
  
  const myCounter = counter(10, 0, 15);
  console.log("Initial value:", myCounter.getValue());
  
  console.log("After increment:", myCounter.increment());
  console.log("After increment by 3:", myCounter.increment(3));
  
  console.log("After decrement:", myCounter.decrement());
  console.log("After attempting to go below min:", myCounter.decrement(20));
  
  console.log("After multiply by 2:", myCounter.multiply(2));
  console.log("After multiply by 0.5:", myCounter.multiply(0.5));
  
  console.log("After reset:", myCounter.reset());
  console.log("After setting to 5:", myCounter.setValue(5));
  
  console.log("Final value:", myCounter.getValue());
  console.log("All tests completed!");
}

// Run the test
testCounter();

module.exports = { counter }; 