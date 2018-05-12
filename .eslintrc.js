module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "globals": {
      "DataView": false,
      "ArrayBuffer": false,
      "Uint32Array": false,
      "Uint16Array": false,
      "Uint8Array": false,
      "Int32Array": false,
      "Int16Array": false,
      "Int8Array": false,
      "Float64Array": false,
      "Float32Array": false
    },
    "rules": {
      "no-unused-vars": "off",
      "no-constant-condition": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-useless-escape": "off",
      "no-console": "off"
    }
};
