export default [
  {
    ignores: [
      "dist/",
      "node_modules/",
      "test-models.mjs",
      "fix_css.mjs",
      ".git/"
    ]
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        alert: "readonly",
        prompt: "readonly",
        IntersectionObserver: "readonly",
        requestAnimationFrame: "readonly",
        fetch: "readonly",
        Notification: "readonly",
        Lenis: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": "error"
    }
  }
];
