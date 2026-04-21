import rateLimit from "express-rate-limit";

const baseConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    msg: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
};

export const authRateLimiter = rateLimit({
  ...baseConfig,
  max: 30,
});

export const apiRateLimiter = rateLimit({
  ...baseConfig,
  max: 300,
});

export const rateLimiter = apiRateLimiter;
