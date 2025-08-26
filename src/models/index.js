const Book = require("./Book");
const Borrower = require("./Borrower");
const Borrowing = require("./Borrowing");
const {
  bookSchemas,
  borrowerSchemas,
  borrowingSchemas,
  responseSchemas,
  querySchemas,
  validationHelpers,
  commonPatterns,
} = require("./validation");
const ModelTransformers = require("./transformers");

module.exports = {
  Book,
  Borrower,
  Borrowing,

  validation: {
    bookSchemas,
    borrowerSchemas,
    borrowingSchemas,
    responseSchemas,
    querySchemas,
    validationHelpers,
    commonPatterns,
  },

  transformers: ModelTransformers,
};
