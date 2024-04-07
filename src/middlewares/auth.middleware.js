const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
// const logger = require("../configs/logger");
const ApiError = require("../utils/ApiError");
const { getAuth } = require("firebase-admin/auth");
const firebaseApp = require("../config/firebase");

const jwt = require("jsonwebtoken");
const { userService } = require("../services");

// const auth = catchAsync(async (req, res, next) => {
//   const token = req.headers["x-access-token"];
//   if (token) {
//     try {
//       req.user = jwt.verify(token, process.env.TOKEN_KEY);
//       if (["admin", "mod"].includes(req.user.role)) req.user.isStaff = true;
//     } catch (error) {
//       logger.error(error);
//       throw new ApiError(httpStatus.FORBIDDEN, "INVALID TOKEN");
//     }
//   }
//   next();
// });

// const adminRequire = catchAsync(async (req, res, next) => {
//   const token = req.headers["x-access-token"];
//   if (token) {
//     try {
//       req.user = jwt.verify(token, process.env.TOKEN_KEY);
//       if (req.user.role == "admin") return next();
//     } catch (error) {
//       logger.error(error);
//     }
//   }
//   throw new ApiError(httpStatus.UNAUTHORIZED, "ADMIN REQUIRED");
// });

// const staffRequire = catchAsync(async (req, res, next) => {
//   const token = req.headers["x-access-token"];
//   if (token) {
//     try {
//       req.user = jwt.verify(token, process.env.TOKEN_KEY);
//       if (["admin", "mod"].includes(req.user.role)) return next();
//     } catch (error) {
//       logger.error(error);
//     }
//   }
//   throw new ApiError(httpStatus.UNAUTHORIZED, "STAFF REQUIRE");
// });

const authRequire = catchAsync(async (req, res, next) => {
  const token = req.headers["x-access-token"];
  const user = await getAuth(firebaseApp).verifyIdToken(token)
  req.auth = user;
  console.log(req.auth);
  /*  {
name: 'Thành Nguyễn Chi',
picture: 'https://lh3.googleusercontent.com/a/ACg8ocIdKHNTmMi_3aqnTyYwXiASv_zDX4i4Vi4NPkxl9s8=s96-c',
iss: 'https://securetoken.google.com/thanhproj-63169',
aud: 'thanhproj-63169',
auth_time: 1712479109,
user_id: 'juo3v5nPOAYj4TTSNmit5GtTpn83',
sub: 'juo3v5nPOAYj4TTSNmit5GtTpn83',
iat: 1712480034,
exp: 1712483634,
email: 'caitendenhonhat@gmail.com',
email_verified: true,
firebase: { identities: [Object], sign_in_provider: 'google.com' },
uid: 'juo3v5nPOAYj4TTSNmit5GtTpn83'
} */
  const dbUser = await userService.getUserById(user.uid)
  req.auth.role = dbUser.role;

  return next();

  // .catch((error) => {
  //   // Handle error
  //   throw new ApiError(httpStatus.UNAUTHORIZED, "UNAUTHORIZED");
  // });

});

module.exports = { /*auth, adminRequire, staffRequire,*/ authRequire };
