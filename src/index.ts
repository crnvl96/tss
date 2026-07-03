export const greet = (name: string): string => `Hello, ${name}!`;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(greet("world"));
}
