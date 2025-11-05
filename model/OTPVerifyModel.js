const mongoose = require ('mongoose')

const OTPVerificationSchema  = new mongoose.Schema({
    user:String,
    otp:String,
    Created:Date,
    Expiry:Date
})

const OTPVerification = mongoose.model('OTPVerification',OTPVerificationSchema)
module.exports = OTPVerification