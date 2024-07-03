const adminRequire = catchAsync(async (req, res, next) => {
    const reqUser = req.auth;
    if(reqUser.role!='admin'){
        res.status(httpStatus.UNAUTHORIZED).send()
        return
    }

    return next();
  });
  
  module.exports = { adminRequire };