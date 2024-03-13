const userModel = require("../models/user")

const requireAuth = async (req, res, next) => {
    if (req.headers.authorization) {
        const user = await userModel.findOne({
            token: req.headers.authorization.replace("Bearer ", "")
        })

        if (!user) {
            // throw createHttpError(401, "Unauthorized")
            res.status(401).json({ message: "Unauthorized" })
        } else {
            req.user = user
            next()
        }
    } else {
        // throw createHttpError(401, "Unauthorized")
        res.status(401).json({ message: "Unauthorized" })
    }
}
module.exports = {requireAuth}