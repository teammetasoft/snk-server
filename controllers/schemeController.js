const Scheme = require("../model/schemeModel");
const { uploadFileToFolder, deleteFile } = require("../helpers/s3");

const crypto = require("crypto");
const S3Url = process.env.AWS_BUCKET_URL;

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const createScheme = async (req, res, next) => {
  try {
    const imageFile = req.file; // Single uploaded image
    let imageUrl = "";

    // Upload single image to S3 (if exists)
    if (imageFile) {
      const imageName = generateFileName();
      await uploadFileToFolder(
        imageFile.buffer,
        imageName,
        imageFile.mimetype,
        "SKN-Images/"
      );
      imageUrl = S3Url + "SKN-Images/" + imageName;
    }

    // Create new scheme entry
    const newScheme = new Scheme({
      ...req.body,
      image: imageUrl || null, // Store single image URL or null
      createdBy: req.user.id,
    });

    const savedScheme = await newScheme.save();

    res.status(201).json({
      success: true,
      message: "Scheme created successfully",
      data: savedScheme,
    });
  } catch (err) {
    console.error("Error creating scheme:", err);
    next(err);
  }
};

const getSchemeById = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    
    if (!scheme ||scheme.status==='deleted') return res.status(404).json({ message: "Scheme not found" });
    res.json({ success: true, data: scheme });
  } catch (err) {
    next(err);
  }
};

const deleteScheme = async (req, res, next) => {
  try {
    await Scheme.findByIdAndUpdate(req.params.id, { status: "deleted" });
    res.json({ success: true, message: "Scheme deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createScheme,
  getSchemeById,
  deleteScheme,
};
