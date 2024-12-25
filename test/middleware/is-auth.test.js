const jwt = require("jsonwebtoken");

const isAuth = require("../../middleware/is-auth");
const { throwError } = require("../../util/error");

jest.mock("jsonwebtoken");
jest.mock("../../util/error");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      get: jest.fn(),
    };
    res = {};
    next = jest.fn();
    throwError.mockImplementation((statusCode, message, next) => {
      const error = new Error(message);
      error.statusCode = statusCode;
      next(error);
    });
  });

  it("should throw an error if no authorization header is present", () => {
    req.get.mockReturnValueOnce(null);

    isAuth(req, res, next);

    expect(throwError).toHaveBeenCalledWith(401, "Unauthorized", next);
  });

  it("should throw an error if the token is invalid", () => {
    req.get.mockReturnValueOnce("Bearer invalidtoken");
    jwt.verify.mockImplementationOnce(() => {
      throw new Error("Invalid token");
    });

    isAuth(req, res, next);

    expect(throwError).toHaveBeenCalledWith(401, "Invalid token", next);
  });

  it("should set userId on the request if the token is valid", () => {
    req.get.mockReturnValueOnce("Bearer validtoken");
    jwt.verify.mockReturnValueOnce({ userId: "abc123" });

    isAuth(req, res, next);

    expect(req.userId).toBe("abc123");
    expect(next).toHaveBeenCalled();
  });
});
