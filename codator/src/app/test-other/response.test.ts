export const TEST_RESPONSE_FOR_CODE = `You can create a TypeScript function to rotate an array in various ways depending on the direction and number of places you want to rotate the array. Below is an example of a function that rotates an array to the right by a given number of positions.

Here's the function:

\`\`\`typescript
function rotateArray<T>(array: T[], positions: number): T[] {
    const length = array.length;

    // Handle cases where positions is greater than array length
    const effectivePositions = positions % length;

    // If effective positions is zero, return the same array
    if (effectivePositions === 0) {
        return array;
    }

    // Split the array into two parts and concatenate
    const rotatedPart = array.slice(length - effectivePositions);
    const remainingPart = array.slice(0, length - effectivePositions);

    return [...rotatedPart, ...remainingPart];
}

// Example usage:
const arr = [1, 2, 3, 4, 5];
const rotatedArr = rotateArray(arr, 2);
console.log(rotatedArr);  // Output: [4, 5, 1, 2, 3]
\`\`\`

### Explanation:
1. **Generic Type**: The function uses a generic type \`<T>\` to allow the array to be of any type.
2. **Effective Positions**: We compute the effective number of positions because rotating an array by its length results in the same array.
3. **Slice and Concatenate**: We use \`slice\` to divide the array into two parts. The last \`effectivePositions\` elements will be moved to the front, and the remaining part will follow.

### Rotate Left:
If you want to rotate the array to the left, you can simply modify the slicing part:

\`\`\`typescript
function rotateArrayLeft<T>(array: T[], positions: number): T[] {
    const length = array.length;

    const effectivePositions = positions % length;

    if (effectivePositions === 0) {
        return array;
    }

    const rotatedPart = array.slice(effectivePositions);
    const remainingPart = array.slice(0, effectivePositions);

    return [...rotatedPart, ...remainingPart];
}

// Example usage:
const arrLeft = [1, 2, 3, 4, 5];
const rotatedArrLeft = rotateArrayLeft(arrLeft, 2);
console.log(rotatedArrLeft);  // Output: [3, 4, 5, 1, 2]
\`\`\`

This function can also be used to rotate an array to the left by simply changing the slicing logic. Adjust the example to suit your specific requirements!`;
