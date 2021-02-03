module.exports = {
  env: {
    webextensions: true,
    browser: true,
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended", "prettier"],
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 6,
  },
  rules: {
    "prettier/prettier": "error",
    "spaced-comment": [1, "always"],
  },
};
