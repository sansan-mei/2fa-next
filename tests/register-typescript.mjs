import { registerHooks } from 'node:module';

// Resolve the app's extensionless TypeScript imports without building the app.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (specifier.startsWith('.') && !specifier.split('/').at(-1).includes('.')) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
