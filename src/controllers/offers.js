const offerModel = require("../models/offer");
const mongoose = require("mongoose");
const env = require('../utils/validateEnv');
const createHttpError = require("http-errors");
const cloudinary = require("cloudinary").v2
const {convertToBase64} = require("../utils/convertToBase64");

cloudinary.config({ 
    cloud_name: env.CLOUDINARY_NAME, 
    api_key: env.CLOUDINARY_API_KEY, 
    api_secret: env.CLOUDINARY_API_SECRET 
})

const getOffers = async (req, res, next) => {
    const {title, priceMin, priceMax, sort, page, limit} = req.query
    
    try {
        if (priceMin && (isNaN(priceMin) || priceMin < 1 || priceMin > 100000)) {
            throw createHttpError(400, "PriceMin must be a number between 1 and 100000")
        }

        if (priceMax && (isNaN(priceMax) || priceMax < 1 || priceMax > 100000)) {
            throw createHttpError(400, "PriceMax must be a number between 1 and 100000")
        }

        if (sort && !["price-asc", "price-desc"].includes(sort)) {
            throw createHttpError(400, "Invalid sort parameter")
        }

        if (page && (isNaN(page) || page < 1)) {
            page = 1
        }

        const filteredOffers = {
            product_name: new RegExp(title, "i"),
            product_price: {
                $gte: priceMin,
                $lte: priceMax,
            },
        }

        const sortOffers = sort === "price-asc" ? {product_price: 1} : sort === "price-desc" ? {product_price: -1} : null


        const offers = await offerModel.find(filteredOffers)
            .populate({path: "owner", select: "account"})
            .sort(sortOffers)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec()

        const count = await offerModel.countDocuments(filteredOffers).exec()

        res.status(200).json({
            count: count,
            offers: offers
        })
    } catch (error) {
        next(error)
    }
}

const getOffer = async (req, res, next) => {
    const offerId = req.params.id

    try {
        if (!mongoose.isValidObjectId(offerId)) {
            throw createHttpError(400, "Invalid offer ID")
        }

        const offer = await offerModel.findById(offerId).populate({
            path: "owner",
            select: "account.username account.avatar"
        }).exec()
        if (!offer) {
            throw createHttpError(404, "Offer not found")
        }

        res.status(200).json(offer)
    } catch (error) {
        next(error)
    }

}

const publishOffer = async (req, res, next) => {
  const {
    title,
    description,
    price,
    condition,
    city,
    brand,
    size,
    color,
  } = req.body

  const picturesToUpload = req.files?.pictures

  try {
    if (!title || !description || !price || !picturesToUpload) {
      throw createHttpError(400, "Missing required fields")
    }

    if (isNaN(price) || price < 1 || price > 100000) {
        throw createHttpError(400, "Price must be a number between 1 and 100000")
    }

    if (title.length > 50) {
        throw createHttpError(400, "Title must be 50 characters or less")
    }

    if (description.length > 500) {
        throw createHttpError(400, "Description must be 500 characters or less")
    }

    const newOffer = new offerModel({
        product_name: title,
        product_description: description,
        product_price: Number(price),
        product_details: [
          { condition: condition },
          { city: city },
          { brand: brand },
          { size: size },
          { color: color },
        ],
        owner: req.user,
    });

    if (!Array.isArray(picturesToUpload)) {
        if (picturesToUpload.mimetype.slice(0, 5) !== "image") {
            throw createHttpError(400, "Invalid file type")
        }

        const picture = await cloudinary.uploader.upload(convertToBase64(picturesToUpload), {
            folder: `vinted/offers/${newOffer._id}`,
            public_id: "preview"
        })

        newOffer.product_image = picture
        newOffer.product_pictures.push(picture)
    } else {
        for (let i = 0; i < picturesToUpload.length; i++) {
            const file = picturesToUpload[i]
            
            if (picturesToUpload[i].mimetype.slice(0, 5) !== "image") {
                throw createHttpError(400, "Invalid file type")
            }
            if (i === 0) {
                const picture = await cloudinary.uploader.upload(convertToBase64(file), {
                    folder: `vinted/offers/${newOffer._id}`,
                    public_id: "preview"
                })
                newOffer.product_image = picture
                newOffer.product_pictures.push(picture)
            } else {
                const picture = await cloudinary.uploader.upload(convertToBase64(file), {
                    folder: `vinted/offers/${newOffer._id}`,
                })
                newOffer.product_pictures.push(picture)
            }
        }
    }

    await newOffer.save();
    res.status(201).json(newOffer);
  } catch (error) {
    next(error)
  }
};

const modifyOffer = async (req, res, next) => {
    const offerId = req.params.id
    
    const {
        newTitle,
        newDescription,
        newPrice,
        newCondition,
        newCity,
        newBrand,
        newSize,
        newColor,
    } = req?.body 
    
    const newPictureToUpload = req.files?.pictures

    try {
        if (!mongoose.isValidObjectId(offerId)) {
            throw createHttpError(400, "Invalid offer ID")
        }

        if (!newTitle || !newDescription || !newPrice || !picturesToUpload) {
            throw createHttpError(400, "Missing required fields")
        }

        const offer = await offerModel.findById(offerId).exec()
        if (!offer) {
            throw createHttpError(404, "Offer not found")
        }

        if (offer.owner._id.toString() !== req.user._id.toString()) {
            throw createHttpError(403, "You are not allowed to modify this offer")
        }

        offer.product_name = newTitle
        offer.product_description = newDescription
        offer.product_price = Number(newPrice)
        offer.product_details = [
            { condition: newCondition },
            { city: newCity },
            { brand: newBrand },
            { size: newSize },
            { color: newColor },
        ]
        offer.markModified("product_details") // Mongoose doesn't detect changes in arrays, so we need to mark it as modified

        newPictureToUpload && await cloudinary.uploader.destroy(offer.product_image.public_id)
        await cloudinary.uploader.upload(convertToBase64(newPictureToUpload), {
            folder: `vinted/offers/${offerId}`,
            public_id: "preview"
        })
        
        offer.product_image = newPictureToUpload
        offer.product_pictures[0] = newPictureToUpload
        
        await offer.save()
        res.status(200).json({message: `Offer ${offer.product_name} modified succesfully by ${req.user.account.username}`})
    } catch (error) {
        next(error)
    }
}

const deleteOffer = async (req, res, next) => {
    const offerId = req.params.id

    try {
        if (!mongoose.isValidObjectId(offerId)) {
            throw createHttpError(400, "Invalid offer ID")
        }

        const offer = await offerModel.findById(offerId).exec()
        if (!offer) {
            throw createHttpError(404, "Offer not found")
        }

        if (offer.owner._id.toString() !== req.user._id.toString()) {
            throw createHttpError(403, "You are not allowed to delete this offer")
        }

        await cloudinary.api.delete_resources_by_prefix(`vinted/offers/${offerId}`) // Delete all pictures in the offer folder
        await cloudinary.api.delete_folder(`vinted/offers/${offerId}`) // Delete the offer folder

        await offerModel.findByIdAndDelete(offerId).exec()
        res.status(204).json({message: `Offer ${offer.product_name} deleted successfully by ${req.user.account.username}`})
    } catch (error) {
        next(error)
    }
}

module.exports = {getOffers, getOffer, publishOffer, modifyOffer, deleteOffer}
