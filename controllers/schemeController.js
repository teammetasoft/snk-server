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


const getAllSchemes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    
    const searchQuery = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { systemName: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

  
    const filters = {status:"active"};
    if (req.query.status) {
      filters.status = req.query.status||'active';
    }
   
   if (req.query.installmentMin || req.query.installmentMax) {
      filters["installmentPlans.value"] = {};
      if (req.query.installmentMin) {
        filters["installmentPlans.value"].$gte = Number(req.query.installmentMin);
      }
      if (req.query.installmentMax) {
        filters["installmentPlans.value"].$lte = Number(req.query.installmentMax);
      }
    }

   

    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort.replace(/Asc|Desc$/, "");
      const sortOrder = req.query.sort.endsWith("Asc") ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 }; 
    }

   
    const query = { ...searchQuery, ...filters };
 console.log(sort)
    const total = await Scheme.countDocuments(query);
    const schemes = await Scheme.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email"); 

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: schemes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getAllSchemes };


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
  getAllSchemes,
  getSchemeById,
  deleteScheme,
};
