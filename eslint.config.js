const { ESLint } = require("eslint")

module.exports = {
  extends: ["next/core-web-vitals", "prettier", "@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint", "import", "jsx-a11y", "tailwindcss"],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // Import rules
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],

    // React rules
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/exhaustive-deps": "warn",

    // Accessibility rules
    "jsx-a11y/anchor-is-valid": "off",

    // Tailwind rules
    "tailwindcss/classnames-order": "warn",
    "tailwindcss/no-custom-classname": "off",

    // General rules
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
