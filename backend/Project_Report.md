# College Project Report

## Ch.3 System Design

### I. Database Design

#### i. Data Dictionary

#### ii. Entity-Relationship Diagram

### II. GUI Design (Actual GUI Screen shot)

## Ch.4 System Development

### Coding Standards

Coding standards in system development refer to a set of guidelines, conventions, and best practices that developers adhere to when writing code. These standards ensure consistency, readability, maintainability, and overall quality of the codebase. They encompass various aspects of coding such as naming conventions, formatting rules, documentation practices, error handling strategies, and usage of programming constructs.

Consistent naming conventions make it easier for developers to understand the purpose and functionality of variables, functions, classes, and other elements within the codebase. Clear and descriptive names enhance code readability and reduce the cognitive load required to comprehend the code.

Error handling strategies define how errors and exceptions are handled within the code. Proper error handling improves the robustness and reliability of the software by gracefully handling unexpected situations and providing informative error messages to users and developers.

Usage of programming constructs refers to the appropriate and efficient use of language features, libraries, and frameworks. Adhering to best practices and avoiding anti-patterns ensures that the code is efficient, maintainable, and scalable.

Overall, coding standards play a crucial role in the software development lifecycle by promoting consistency, readability, and maintainability, ultimately leading to higher-quality software products.

#### Purpose of Having Coding Standards:

A coding standard gives a uniform appearance to the codes written by different engineers. It improves readability, and maintainability of the code and it reduces complexity also. It helps in code reuse and helps to detect error easily.

It promotes sound programming practices and increases efficiency of the programmers. Some of the coding standards are given below:

- **Limited use of global**: These rules talk about which types of data that can be declared global and the data that can't be.

- **Standard headers for different modules**: For better understanding and maintenance of the code, the header of different modules should follow some standard format and information. The header format must contain below things that is being used in various companies:
  - Name of the module
  - Date of module creation
  - Author of the module
  - Modification history
  - Synopsis of the module about what the module does
  - Different functions supported in the module along with their input output parameters
  - Global variables accessed or modified by the module

- **Naming conventions for local variables, global variables, constants and functions**:
  - Meaningful and understandable variables name help anyone to understand the reason of using it.
  - Local variables should be named using camel case lettering starting with small letter (e.g. localData) whereas Global variables names should start with a capital letter (e.g. GlobalData). Constant names should be formed using capital letters only (e.g. CONSDATA).
  - It is better to avoid the use of digits in variable names.
  - The names of the function should be written in camel case starting with small letters.
  - The name of the function must describe the reason of using the function clearly and briefly.

- **Indentation**: Proper indentation is very important to increase the readability of the code. For making the code readable, programmers should use White spaces properly. Some of the spacing conventions are given below:
  - There must be a space after giving a comma between two function arguments.
  - Proper Indentation should be there at the beginning and at the end of each block in the program.
  - All braces should start from a new line and the code following the end of braces also start from a new line.

- **Error return values and exception handling conventions**: All functions that encountering an error condition should either return a 0 or 1 for simplifying the debugging.

On the other hand, Coding guidelines give some general suggestions regarding the coding style that to be followed for the betterment of understandability and readability of the code.

- **Avoid using a coding style that is too difficult to understand**: Code should be easily understandable. The complex code makes maintenance and debugging difficult and expensive.

- **Avoid using an identifier for multiple purposes**: Each variable should be given a descriptive and meaningful name indicating the reason behind using it. This is not possible if an identifier is used for multiple purposes and thus it can lead to confusion to the reader. Moreover, it leads to more difficulty during future enhancements.

- **Code should be well documented**: The code should be properly commented for understanding easily. Comments regarding the statements increase the understandability of the code.

### Tools Explanation

## Ch.5 Testing

### Testing Strategy

### Testing Methods

### Test cases

## Ch.6 Conclusion

### Benefits

### Limitations

### Future Enhancements 