const upload=require('multer')();
const {adduser,loginuser, getCurrentUser, postEmail}=require('../controllers/userController');
const router=require('express').Router();

router.post('/signin',upload.single("image"),adduser);
router.post('/login',loginuser);
router.get('/current-user/:vendorId', getCurrentUser); 
router.post('/post-email', postEmail)
module.exports=router