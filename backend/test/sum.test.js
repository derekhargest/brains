   // Function with a bug
   function sum(a, b) {
    // Missing return statement
    a + b;
  }
  
  // Test
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
  
  module.exports = sum;