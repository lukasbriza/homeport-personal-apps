<div align="center">

# ESLint Config

### [ESLint](https://eslint.org) configuration for projects

</div>

## Usage

Use one of the following configurations in your `.eslintrc.cjs`:

### Base

```javascript
module.exports = {
  extends: '@lukasbriza/eslint-config',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
```

### CommonJS

```javascript
module.exports = {
  extends: '@lukasbriza/eslint-config/cjs',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
```

### React

```javascript
module.exports = {
  extends: '@lukasbriza/eslint-config/react',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
```

### Next.js

```javascript
module.exports = {
  extends: '@lukasbriza/eslint-config/nextjs',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
```
