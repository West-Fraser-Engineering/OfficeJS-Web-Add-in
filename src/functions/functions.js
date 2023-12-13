

/**
 * Adds two numbers
 * @CustomFunction
 * @param {number} first The first number
 * @param {number} second The second number
 * @returns The sum of the two numbers
 */
function custom_add(first, second) {
    return first + second;
}

CustomFunctions.associate("CUSTOM_ADD", custom_add);