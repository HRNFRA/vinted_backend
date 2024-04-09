const userModel = require("../models/user");
const env = require("../utils/validateEnv");
const createHttpError = require("http-errors");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
const {convertToBase64} = require("../utils/convertToBase64");

cloudinary.config({ 
  cloud_name: env.CLOUDINARY_NAME, 
  api_key: env.CLOUDINARY_API_KEY, 
  api_secret: env.CLOUDINARY_API_KEY
})

const signUp = async (req, res, next) => {
  const { username, email, password, newsletter } = req.body
  // const avatarToUpload = req.files.avatar

  const salt = uid2(16)
  const hash = SHA256(password + salt).toString(encBase64)
  const token = uid2(16)

  try {
    if (!username || !email || !password) {
      throw createHttpError(400, "Missing required fields")
    }

    const spaceInUsername = username.includes(" ")
    if (spaceInUsername) {
      throw createHttpError(406, "Username cannot contain spaces")
    }

    const existingUser = await userModel.findOne({ username: username }).exec()
    if (existingUser) {
      throw createHttpError(409, "Username already taken")
    }

    const existingEmail = await userModel.findOne({ email: email }).exec()
    if (existingEmail) {
      throw createHttpError(409, "Email already taken");
    }

    // const avatar = await cloudinary.uploader.upload(convertToBase64(avatarToUpload), {
    //     folder: `vinted/users/${email}`,
    // })

    const newUser = new userModel({
      email: email,
      account: {
        username: username,
        // avatar: {
        //   secure_url: avatar.secure_url,
        // }
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    })

    await newUser.save()

    res.status(201).json({ message: `User created: ${email}` })
  } catch (error) {
    next(error)
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      throw createHttpError(400, "Missing required fields")
    }

    const user = await userModel
      .findOne({ email: email })
      .select("+password")
      .exec()
    if (!user) {
      throw createHttpError(401, "Invalid credentials")
    }

    const hash = SHA256(password + user.salt).toString(encBase64)
    if (hash !== user.hash) {
      throw createHttpError(401, "Invalid credentials")
    }

    res.status(200).json({
      _id: user._id,
      token: user.token,
      account: user.account,
    })

  } catch (error) {
    next(error);
  }
}

const logout = async (req, res, next) => {
  const user = req.user
  user.destroy(error => {
    if (error) {
      next(error)
    }
    res.status(200).json({ message: "User logged out" })
  })

}


module.exports = { signUp, login, logout };
