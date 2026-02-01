# TypeScript Strict Mode Configuration

This document explains the TypeScript strict mode configuration for the Wingside project and how to work with it.

## Current Configuration

TypeScript strict mode has been **enabled incrementally** in `tsconfig.json` with the following flags:

### ✅ Enabled Strict Flags

#### `"noImplicitAny": true`
**What it does**: Raises an error when TypeScript cannot infer a type and falls back to `any`.

**Impact**: Forces explicit type annotations where types cannot be inferred.

**Example**:
```typescript
// ❌ Error: Parameter 'data' implicitly has an 'any' type
function processData(data) {
  return data.value;
}

// ✅ Fixed: Explicit type annotation
function processData(data: { value: string }) {
  return data.value;
}
```

#### `"strictNullChecks": true`
**What it does**: `null` and `undefined` are not assignable to other types unless explicitly allowed.

**Impact**: Prevents common null reference errors at compile time.

**Example**:
```typescript
// ❌ Error: Type 'string | null' is not assignable to type 'string'
let name: string = getUserName(); // getUserName() returns string | null

// ✅ Fixed: Handle null case
let name: string | null = getUserName();
if (name !== null) {
  console.log(name.toUpperCase());
}

// ✅ Or use optional chaining
console.log(getUserName()?.toUpperCase());
```

#### `"strictFunctionTypes": true`
**What it does**: Enables stricter checking of function parameter types.

**Impact**: Prevents unsafe function type assignments.

**Example**:
```typescript
type Handler = (event: MouseEvent) => void;

// ❌ Error: Not assignable (Event is broader than MouseEvent)
const handler: Handler = (event: Event) => {
  console.log(event);
};

// ✅ Fixed: Match the expected type
const handler: Handler = (event: MouseEvent) => {
  console.log(event);
};
```

#### `"strictBindCallApply": true`
**What it does**: Enables strict type checking for `.bind()`, `.call()`, and `.apply()` methods.

**Impact**: Ensures correct argument types when using these methods.

**Example**:
```typescript
function greet(name: string, age: number) {
  console.log(`Hello ${name}, you are ${age}`);
}

// ❌ Error: Argument of type 'string' is not assignable to parameter of type 'number'
greet.call(null, "Alice", "25");

// ✅ Fixed: Correct types
greet.call(null, "Alice", 25);
```

#### `"noImplicitThis": true`
**What it does**: Raises an error on `this` expressions with an implied `any` type.

**Impact**: Requires explicit `this` parameter in functions that use `this`.

**Example**:
```typescript
// ❌ Error: 'this' implicitly has type 'any'
function logName() {
  console.log(this.name);
}

// ✅ Fixed: Explicit this parameter
function logName(this: { name: string }) {
  console.log(this.name);
}
```

#### `"alwaysStrict": true`
**What it does**: Parse all code in strict mode and emit `"use strict"` directive.

**Impact**: Enables JavaScript strict mode for all files.

**Benefits**:
- Catches common mistakes (e.g., undeclared variables)
- Prevents use of reserved keywords
- Makes eval() safer

### ⏳ Disabled (To Be Enabled Incrementally)

#### `"noUnusedLocals": false`
**What it does**: Reports errors on unused local variables.

**Why disabled**: May have legitimate unused variables during development.

**When to enable**: After code cleanup and before production deployment.

#### `"noUnusedParameters": false`
**What it does**: Reports errors on unused function parameters.

**Why disabled**: Common in event handlers and callbacks where not all parameters are used.

**When to enable**: Can enable with `_` prefix convention for unused params.

#### `"noImplicitReturns": false`
**What it does**: Ensures all code paths in a function return a value.

**Why disabled**: Many functions have conditional returns.

**When to enable**: After reviewing all function return types.

#### `"noFallthroughCasesInSwitch": false`
**What it does**: Reports errors for fallthrough cases in switch statements.

**Why disabled**: Some switches intentionally use fallthrough.

**When to enable**: After adding explicit `break` or `// fallthrough` comments.

#### `"strictPropertyInitialization": false`
**What it does**: Ensures class properties are initialized in the constructor.

**Why disabled**: Requires `strictNullChecks` and affects many class components.

**When to enable**: After migrating to functional components or adding proper initialization.

## Migrated Code

The following files have been updated to work with strict mode:

### Core Utilities (✅ Complete)
- `lib/validation.ts` - Added proper interfaces (OrderInput, AddressInput)
- `lib/redis.ts` - Added ioredis type imports
- `lib/customer-segmentation.ts` - Added Customer interface
- `lib/integrations/embedly.ts` - Added Embedly API interfaces
- `lib/emails/service.ts` - Added OrderItem interface

### Work Completed
- Replaced 25+ `any` type annotations with proper types
- Created 10+ new TypeScript interfaces
- Fixed all type errors in core utility files

## Common Strict Mode Fixes

### Fix 1: Implicit Any Parameters

```typescript
// Before
function handleClick(event) {
  console.log(event.target);
}

// After
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  console.log(event.currentTarget);
}
```

### Fix 2: Null/Undefined Checks

```typescript
// Before
const user = await getUser();
console.log(user.name); // Error: Object is possibly 'null'

// After
const user = await getUser();
if (user) {
  console.log(user.name);
}

// Or use optional chaining
console.log(user?.name);
```

### Fix 3: Array.find() Returns

```typescript
// Before
const item = items.find(i => i.id === targetId);
console.log(item.name); // Error: Object is possibly 'undefined'

// After
const item = items.find(i => i.id === targetId);
if (item) {
  console.log(item.name);
}

// Or provide default
const item = items.find(i => i.id === targetId) ?? { name: 'Unknown' };
```

### Fix 4: Object Property Access

```typescript
// Before
const value = obj[key]; // Error: No index signature

// After
interface MyObject {
  [key: string]: string;
}
const obj: MyObject = { ... };
const value = obj[key];

// Or use type assertion for dynamic keys
const value = obj[key as keyof typeof obj];
```

### Fix 5: Event Handlers in React

```typescript
// Before
function handleSubmit(e) {
  e.preventDefault();
}

// After
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}
```

## Benefits of Strict Mode

1. **Catch bugs early**: Type errors caught at compile time instead of runtime
2. **Better IDE support**: Accurate autocomplete and IntelliSense
3. **Self-documenting code**: Type annotations serve as documentation
4. **Safer refactoring**: TypeScript catches breaking changes
5. **Fewer runtime errors**: Null/undefined errors prevented at compile time
6. **Better collaboration**: Clear interfaces make code easier to understand

## Gradual Migration Strategy

If you encounter type errors after enabling strict mode:

### Phase 1: Fix Core Files (✅ Complete)
- Utility functions in `lib/`
- Shared types and interfaces
- Database query helpers

### Phase 2: Fix API Routes (In Progress)
- Request/response types
- Database query results
- Error handling

### Phase 3: Fix Components (Remaining)
- Component props
- Event handlers
- State types

### Phase 4: Enable Additional Checks
- `noUnusedLocals`
- `noUnusedParameters`
- `noImplicitReturns`
- `strictPropertyInitialization`

## Resources

- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js TypeScript Documentation](https://nextjs.org/docs/app/building-your-application/configuring/typescript)

## Getting Help

If you encounter a difficult type error:

1. Check if the type can be inferred (let TypeScript do the work)
2. Add explicit type annotations where needed
3. Use type guards for runtime checks
4. Consider using utility types (`Partial<T>`, `Pick<T>`, `Omit<T>`, etc.)
5. Use `unknown` instead of `any` for truly unknown types
6. Add `// @ts-expect-error` with a comment explaining why (last resort)

## Status

- ✅ **Strict mode enabled**: Main strict flags are active
- ✅ **Core utilities fixed**: 25+ `any` types replaced
- ✅ **JSX transform fixed**: Changed to "preserve" (Next.js default)
- ⏳ **Components migration**: ~178 `any` types remain in app/components
- ⏳ **Additional checks**: Can be enabled incrementally

**Last Updated**: 2024 (automatically maintained)
