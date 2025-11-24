const { body } = require("express-validator");

exports.user_validator = [
  body("username").not().isEmpty().withMessage("username is required"),
  body("email")
    .not()
    .isEmpty()
    .withMessage("email is required")
    .trim()
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password shuold min 6 length"),
];
