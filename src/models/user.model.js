const mongoose = require ('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true,"Name is required for creating a user"]
    },
    email: {
        type: String,
        required:[true,"Email is required for creating a user"],
        lowercase: true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
        unique:[true,"Email already exists"]
    },
    password: {
        type: String,
        required:[true,"Password is required for creating a user"],
        minlength:[6,"Password must be at least 6 characters long"],
        select:false
    }
},
    {
        timestamps: true
    
})
userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
})
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
}
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password, this.password);
}
const userModel = mongoose.model("user", userSchema);
module.exports = userModel;