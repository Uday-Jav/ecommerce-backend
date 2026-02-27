const multer = require("multer");

const fs = require("fs");

const path = require("path");


// upload folder path

const uploadDir = path.join(

process.cwd(),

"uploads"

);


// create uploads folder automatically

if(!fs.existsSync(uploadDir)){

fs.mkdirSync(uploadDir);

}


// multer storage

const storage = multer.diskStorage({

destination:(req,file,cb)=>{

cb(null,uploadDir);

},

filename:(req,file,cb)=>{

cb(

null,

Date.now()+"-"+file.originalname

);

}

});


const upload = multer({

storage

});

module.exports = upload;
